import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';
import { CreateTagDto } from './dtos/create-tag.dto';
import { ListTagsDto } from './dtos/list-tags.dto';
import { UpdateTagDto } from './dtos/update-tag.dto';
import { TagService } from './tag.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  private getUserId(req: ExpressRequest): string {
    return (req as ExpressRequest & { user: { userId: string } }).user.userId;
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async listTags(@Request() req: ExpressRequest, @Query() query: ListTagsDto) {
    const ownerId = this.getUserId(req);
    const tags = await this.tagService.listTags(ownerId, query);
    return { message: 'Tags retrieved successfully', tags };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createTag(
    @Request() req: ExpressRequest,
    @Body() createTagDto: CreateTagDto,
  ) {
    const ownerId = this.getUserId(req);
    const tag = await this.tagService.createTag(ownerId, createTagDto);
    return { message: 'Tag created successfully', tag };
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':tagId')
  async updateTag(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Request() req: ExpressRequest,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const ownerId = this.getUserId(req);
    const tag = await this.tagService.updateTag(ownerId, tagId, updateTagDto);
    return { message: 'Tag updated successfully', tag };
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':tagId')
  async deleteTag(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Request() req: ExpressRequest,
  ) {
    const ownerId = this.getUserId(req);
    await this.tagService.deleteTag(ownerId, tagId);
    return { message: 'Tag deleted successfully', id: tagId };
  }
}
