import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, desc, eq, orderNotes, orders } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { OrderTimelineService } from "./order-timeline.service";
import { OrderNotesService } from "./order-notes.service";

// Mock @vcecom/db
jest.mock("@vcecom/db", () => {
  const createWhereResult = (returnValue: any) => {
    const promise = Promise.resolve(returnValue);
    (promise as any).limit = jest.fn(() => Promise.resolve(returnValue));
    return promise;
  };

  const createFromResult = (returnValue: any) => ({
    where: jest.fn(() => createWhereResult(returnValue)),
    limit: jest.fn(() => Promise.resolve(returnValue)),
    orderBy: jest.fn(() => Promise.resolve(returnValue)),
  });

  return {
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => createFromResult([])),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([])),
        })),
      })),
    },
    eq: jest.fn(),
    desc: jest.fn(),
    orderNotes: {},
    orders: {},
  };
});

describe("OrderNotesService", () => {
  let service: OrderNotesService;
  let timelineService: jest.Mocked<OrderTimelineService>;
  let logger: jest.Mocked<PinoLogger>;

  const mockOrderId = "order-123";
  const mockNoteId = "note-123";
  const mockAdminId = "admin-123";
  const mockAdminName = "Admin User";
  const mockAdminEmail = "admin@example.com";

  const mockOrder = {
    id: mockOrderId,
    orderNumber: "ORD-001",
    status: "pending",
    total: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNote = {
    id: mockNoteId,
    orderId: mockOrderId,
    note: "Test note",
    isPublic: false,
    authorId: mockAdminId,
    authorName: mockAdminName,
    authorEmail: mockAdminEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTimelineService = {
      addEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderNotesService,
        {
          provide: OrderTimelineService,
          useValue: mockTimelineService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<OrderNotesService>(OrderNotesService);
    timelineService = module.get(OrderTimelineService) as jest.Mocked<OrderTimelineService>;
    logger = module.get(PinoLogger) as jest.Mocked<PinoLogger>;

    jest.clearAllMocks();
  });

  describe("findByOrderId", () => {
    it("should return notes for an order", async () => {
      // Arrange
      const mockNotes = [mockNote];
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockNotes),
            }),
          }),
        });

      // Act
      const result = await service.findByOrderId(mockOrderId);

      // Assert
      expect(result).toEqual(mockNotes);
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(eq).toHaveBeenCalledWith(orders.id, mockOrderId);
      expect(eq).toHaveBeenCalledWith(orderNotes.orderId, mockOrderId);
    });

    it("should throw NotFoundException when order does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(service.findByOrderId(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByOrderId(mockOrderId)).rejects.toThrow(
        `Order with ID ${mockOrderId} not found`,
      );
    });
  });

  describe("create", () => {
    it("should create a note successfully", async () => {
      // Arrange
      const noteContent = "Test note content";
      const isPublic = false;

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockNote]),
        }),
      });

      // Act
      const result = await service.create(
        mockOrderId,
        noteContent,
        isPublic,
        mockAdminId,
        mockAdminName,
        mockAdminEmail,
      );

      // Assert
      expect(result).toEqual(mockNote);
      expect(db.insert).toHaveBeenCalledWith(orderNotes);
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "admin_note_added",
        title: "Admin Note Added",
        description: noteContent,
        actor: "admin",
        actorId: mockAdminId,
        actorName: mockAdminName,
        actorEmail: mockAdminEmail,
        timestamp: mockNote.createdAt,
        metadata: {
          noteId: mockNoteId,
          isPublic: false,
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it("should create a public note successfully", async () => {
      // Arrange
      const noteContent = "Public note";
      const isPublic = true;
      const publicNote = { ...mockNote, isPublic: true };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([publicNote]),
        }),
      });

      // Act
      const result = await service.create(
        mockOrderId,
        noteContent,
        isPublic,
        mockAdminId,
        mockAdminName,
        mockAdminEmail,
      );

      // Assert
      expect(result).toEqual(publicNote);
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "note_added",
        title: "Note Added",
        description: noteContent,
        actor: "admin",
        actorId: mockAdminId,
        actorName: mockAdminName,
        actorEmail: mockAdminEmail,
        timestamp: publicNote.createdAt,
        metadata: {
          noteId: mockNoteId,
          isPublic: true,
        },
      });
    });

    it("should throw BadRequestException when note is empty", async () => {
      // Act & Assert
      await expect(
        service.create(mockOrderId, "", false, mockAdminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockOrderId, "   ", false, mockAdminId),
      ).rejects.toThrow("Note content cannot be empty");
    });

    it("should throw NotFoundException when order does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.create(mockOrderId, "Test note", false, mockAdminId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(mockOrderId, "Test note", false, mockAdminId),
      ).rejects.toThrow(`Order with ID ${mockOrderId} not found`);
    });

    it("should trim note content", async () => {
      // Arrange
      const noteContent = "  Test note with spaces  ";
      const trimmedContent = "Test note with spaces";
      const trimmedNote = { ...mockNote, note: trimmedContent };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const valuesMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([trimmedNote]),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: valuesMock,
      });

      // Act
      const result = await service.create(mockOrderId, noteContent, false, mockAdminId);

      // Assert
      expect(result.note).toBe(trimmedContent);
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          note: trimmedContent,
        }),
      );
    });
  });
});

