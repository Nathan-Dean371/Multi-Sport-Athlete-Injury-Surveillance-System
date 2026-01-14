import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Multi-Sport Athlete Injury Surveillance System API - v1.0.0';
  }
}
