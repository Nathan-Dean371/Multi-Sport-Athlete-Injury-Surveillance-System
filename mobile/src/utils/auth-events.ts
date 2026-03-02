type AuthEvent = "unauthorized";
type AuthEventListener = () => void;

const listeners: Record<AuthEvent, Set<AuthEventListener>> = {
  unauthorized: new Set<AuthEventListener>(),
};

export function emitUnauthorized(): void {
  listeners.unauthorized.forEach((listener) => listener());
}

export function onUnauthorized(listener: AuthEventListener): () => void {
  listeners.unauthorized.add(listener);

  return () => {
    listeners.unauthorized.delete(listener);
  };
}
