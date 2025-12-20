"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminUpdateImageOrder } from "@/hooks/products/use-admin-update-image-order";
import type { ProductImage } from "@/lib/types/products";

interface MediaReorderProps {
  images: ProductImage[];
  productId: string;
  onReorder?: () => void;
}

interface SortableImageItemProps {
  image: ProductImage;
  index: number;
}

function SortableImageItem({ image, index }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative group">
        <CardContent className="p-0">
          <div className="relative aspect-square">
            <Image
              src={image.url}
              alt={image.altText || `Product image ${index + 1}`}
              fill
              className="object-cover rounded-t-lg"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MediaReorder({
  images,
  productId,
  onReorder,
}: MediaReorderProps) {
  const updateOrder = useAdminUpdateImageOrder(productId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reorderedImages = arrayMove(images, oldIndex, newIndex);

      // Update order for the moved image
      const movedImage = reorderedImages[newIndex];
      try {
        await updateOrder.mutateAsync({
          imageId: movedImage.id,
          order: newIndex,
        });
        onReorder?.();
      } catch (_error) {
        // Error toast is handled by the hook
      }
    },
    [images, updateOrder, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <SortableImageItem key={image.id} image={image} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
