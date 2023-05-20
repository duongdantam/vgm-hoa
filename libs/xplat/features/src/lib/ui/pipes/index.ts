import { DateOrderPipe } from './date-order.pipe';
import { ReadableTimePipe } from './readable-time.pipe';
import { AbbreviateTimePipe } from './abbreviate-time.pipe';
import { FormatBytePipe } from './format-byte.pipe';
import { FormatNamePipe } from './format-name.pipe';

export const UI_PIPES = [DateOrderPipe, ReadableTimePipe, AbbreviateTimePipe, FormatBytePipe, FormatNamePipe];

export * from './date-order.pipe';
export * from './readable-time.pipe';
export * from './abbreviate-time.pipe';
export * from './format-byte.pipe';
export * from './format-name.pipe';
