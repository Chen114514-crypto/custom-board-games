import { Schema, model, Document } from 'mongoose';

interface IBoard extends Document {
  userId: string;
  name: string;
  rows: number;
  cols: number;
  boardStyle: string;
  cells: Record<string, { i: string; n: string; color: string }>;
}

const boardSchema = new Schema<IBoard>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  rows: { type: Number, required: true, min: 2, max: 24 },
  cols: { type: Number, required: true, min: 2, max: 24 },
  boardStyle: { type: String, required: true, enum: ['chess', 'go', 'plain'] },
  cells: { type: Object, default: {} },
});

const Board = model<IBoard>('Board', boardSchema);

export default Board;