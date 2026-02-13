import apiService from './api.service';
import {
  CreateInjuryDto,
  UpdateInjuryDto,
  ResolveInjuryDto,
  InjuryDetailDto,
  PaginatedInjuriesDto,
  QueryInjuriesDto,
} from '../types/injury.types';

class InjuryService {
  async createInjury(injuryDto: CreateInjuryDto): Promise<InjuryDetailDto> {
    try {
      return await apiService.post<InjuryDetailDto>('/injuries', injuryDto);
    } catch (error) {
      console.error('Error creating injury:', error);
      throw error;
    }
  }

  async getAllInjuries(query?: QueryInjuriesDto): Promise<PaginatedInjuriesDto> {
    try {
      const params = new URLSearchParams();
      if (query?.playerId) params.append('playerId', query.playerId);
      if (query?.status) params.append('status', query.status);
      if (query?.severity) params.append('severity', query.severity);
      if (query?.fromDate) params.append('fromDate', query.fromDate);
      if (query?.toDate) params.append('toDate', query.toDate);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.pageSize) params.append('limit', query.pageSize.toString());

      const queryString = params.toString();
      const url = queryString ? `/injuries?${queryString}` : '/injuries';
      
      return await apiService.get<PaginatedInjuriesDto>(url);
    } catch (error) {
      console.error('Error fetching injuries:', error);
      throw error;
    }
  }

  async getInjuryById(injuryId: string): Promise<InjuryDetailDto> {
    try {
      return await apiService.get<InjuryDetailDto>(`/injuries/${injuryId}`);
    } catch (error) {
      console.error(`Error fetching injury ${injuryId}:`, error);
      throw error;
    }
  }

  async updateInjury(injuryId: string, updateDto: UpdateInjuryDto): Promise<InjuryDetailDto> {
    try {
      return await apiService.patch<InjuryDetailDto>(`/injuries/${injuryId}`, updateDto);
    } catch (error) {
      console.error(`Error updating injury ${injuryId}:`, error);
      throw error;
    }
  }

  async resolveInjury(injuryId: string, resolveDto: ResolveInjuryDto): Promise<InjuryDetailDto> {
    try {
      return await apiService.post<InjuryDetailDto>(`/injuries/${injuryId}/resolve`, resolveDto);
    } catch (error) {
      console.error(`Error resolving injury ${injuryId}:`, error);
      throw error;
    }
  }
}

export default new InjuryService();
