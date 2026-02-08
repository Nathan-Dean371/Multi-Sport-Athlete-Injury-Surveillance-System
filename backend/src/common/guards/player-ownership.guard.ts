import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';

/**
 * Guard to ensure players can only update their own status
 * while allowing coaches, medical staff, and admins to update any player status
 */
@Injectable()
export class PlayerOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT strategy
    const playerId = request.params.playerId;

    // Players can only update their own status
    if (user.role === 'player') {
      if (user.playerId !== playerId) {
        throw new ForbiddenException('You can only update your own status');
      }
    }

    // Coaches and admins can update any player status
    // (This might be restricted further in production)
    return true;
  }
}
