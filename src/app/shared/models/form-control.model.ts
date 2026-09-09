/**
 * La forma mínima de un error de validación que los controles saben mostrar.
 *
 * Coincide con lo que emite Signal Forms (`kind` más un `message` opcional)
 * sin atarse a sus tipos genéricos, así que un control puede recibir por
 * igual errores construidos a mano.
 */
export interface ControlError {
  readonly kind: string;
  readonly message?: string;
}
