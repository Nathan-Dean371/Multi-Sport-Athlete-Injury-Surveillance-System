import { Injectable, Inject } from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { OrganizationListDto } from "./dto/organization.dto";

@Injectable()
export class ReferenceService {
  constructor(@Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver) {}

  async listOrganizations(): Promise<OrganizationListDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result = await session.run(`
        MATCH (o:Organization)
        RETURN o.orgId as organizationId, o.name as organizationName
        ORDER BY o.name
      `);

      const organizations = result.records.map((r) => ({
        organizationId: r.get("organizationId"),
        organizationName: r.get("organizationName"),
      }));

      return { organizations, total: organizations.length };
    } finally {
      await session.close();
    }
  }
}
