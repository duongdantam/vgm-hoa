import { DateOrderPipe } from './date-order.pipe';
import { ReadableTimePipe } from './readable-time.pipe';
import { AbbreviateTimePipe } from './abbreviate-time.pipe';

export const UI_PIPES = [DateOrderPipe, ReadableTimePipe, AbbreviateTimePipe];

export * from './date-order.pipe';
export * from './readable-time.pipe';
export * from './abbreviate-time.pipe';
