import { Response } from 'express';

export interface ApiResponse<T = null> {
    success:   boolean;
    message:   string;
    data?:     T;
    errors?:   Record<string, string>;
    timestamp: string;
}

export const sendSuccess = <T>(
    res:        Response,
    data:       T,
    message   = '操作成功',
    statusCode = 200
): void => {
    res.status(statusCode).json({
        success:   true,
        message,
        data,
        timestamp: new Date().toISOString(),
    } satisfies ApiResponse<T>);
};

export const sendError = (
    res:       Response,
    message:   string,
    statusCode = 400,
    errors?:   Record<string, string>
): void => {
    res.status(statusCode).json({
        success:   false,
        message,
        ...(errors && { errors }),
        timestamp: new Date().toISOString(),
    } satisfies ApiResponse);
};