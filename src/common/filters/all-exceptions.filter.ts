import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones.
 * Captura todas las excepciones HTTP y errores del sistema para registrarlos en consola
 * utilizando el Logger de NestJS únicamente cuando ocurre un error.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP_ERROR');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determina el código de estado (status)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtiene la estructura del mensaje de error
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: unknown;
    if (exceptionResponse) {
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = responseObj.message ?? exceptionResponse;
      } else {
        message = exceptionResponse;
      }
    } else {
      message =
        exception instanceof Error
          ? exception.message
          : 'Error interno del servidor';
    }

    let formattedMessage = '';
    if (typeof message === 'object' && message !== null) {
      formattedMessage = JSON.stringify(message);
    } else if (typeof message === 'string') {
      formattedMessage = message;
    } else if (typeof message === 'number' || typeof message === 'boolean') {
      formattedMessage = String(message);
    }

    // Registra el error en la consola usando el Logger de Nest
    const logMessage = `${request.method} ${request.url} - Código: ${status} - Mensaje: ${formattedMessage}`;

    if (status >= 500) {
      // Registrar stack trace si es un error interno del servidor (5xx)
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(`${logMessage}\nStack Trace:\n${stack}`);
    } else {
      // Registrar como advertencia si es un error del cliente (4xx)
      this.logger.warn(logMessage);
    }

    // Retorna la respuesta original al cliente si es HttpException,
    // o un formato estándar si es un error inesperado (500)
    response.status(status).json(
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: 'Error interno del servidor',
          },
    );
  }
}
