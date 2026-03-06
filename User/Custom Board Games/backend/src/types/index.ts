// This file exports TypeScript types and interfaces used throughout the backend application.

export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Board {
    id: string;
    name: string;
    rows: number;
    cols: number;
    boardStyle: string;
    cells: Record<string, { i: string; n: string; color: string }>;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateUserProfile {
    username?: string;
    avatarUrl?: string;
}

export interface CreateBoard {
    name: string;
    rows: number;
    cols: number;
    boardStyle: string;
    cells: Record<string, { i: string; n: string; color: string }>;
}