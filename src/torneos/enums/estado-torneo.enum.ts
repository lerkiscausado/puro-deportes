/**
 * Enum de estados posibles de un torneo.
 * Define las fases del ciclo de vida del torneo.
 *
 * - INSCRIPCIONES: El torneo está abierto para inscripción de equipos.
 * - EN_JUEGO: El torneo está en curso con partidos activos.
 * - FINALIZADO: El torneo ha terminado.
 * - SUSPENDIDO: El torneo fue suspendido temporalmente o definitivamente.
 */
export enum EstadoTorneo {
  INSCRIPCIONES = 'Inscripciones',
  EN_JUEGO = 'En Juego',
  FINALIZADO = 'Finalizado',
  SUSPENDIDO = 'Suspendido',
}
