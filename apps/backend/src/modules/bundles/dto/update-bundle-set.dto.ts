import { PartialType } from "@nestjs/swagger";
import { CreateBundleSetDto } from "./create-bundle-set.dto";

export class UpdateBundleSetDto extends PartialType(CreateBundleSetDto) {}
