import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/response';

export const validate = (chains: ValidationChain[]) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await Promise.all(chains.map(chain => chain.run(req)));
        const result = validationResult(req);
        if (!result.isEmpty()) {
            const errors: Record<string, string> = {};
            result.array().forEach(err => {
                if (err.type === 'field' && !errors[err.path]) {
                    errors[err.path] = err.msg;
                }
            });
            sendError(res, '输入数据验证失败', 422, errors);
            return;
        }
        next();
    };