import { Test, TestingModule } from "@nestjs/testing";
import { InjuriesService } from "./injuries.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { Pool } from "pg";
import {
  CreateInjuryDto,
  UpdateInjuryDto,
  ResolveInjuryDto,
  QueryInjuriesDto,
} from "./dto/injury.dto";
import { int } from "neo4j-driver";

describe("InjuriesService", () => {
  let service: InjuriesService;
  let mockNeo4jDriver: jest.Mocked<Driver>;
  let mockSession: jest.Mocked<Session>;
  let mockPool: jest.Mocked<Pool>;

  const mockPlayerQuery = (exists: boolean) => ({
    records: exists
      ? [{ get: () => ({ properties: { pseudonymId: "PLAYER-001" } }) }]
      : [],
  });

  const mockInjuryRecord = {
    get: (key: string) => {
      if (key === "i") {
        return {
          properties: {
            injuryId: "INJ-2024-001",
            injuryType: "Hamstring Strain",
            bodyPart: "Hamstring",
            side: "Left",
            severity: "Moderate",
            status: "Active",
            injuryDate: { toString: () => "2024-01-10T00:00:00.000Z" },
            expectedReturnDate: { toString: () => "2024-02-15T00:00:00.000Z" },
            mechanism: "Overuse",
            diagnosis: "Grade 2 strain",
            treatmentPlan: "RICE protocol",
            notes: "Player reported during training",
            createdAt: { toString: () => "2024-01-10T10:00:00.000Z" },
            updatedAt: { toString: () => "2024-01-10T10:00:00.000Z" },
          },
        };
      }
      if (key === "playerId") return "PLAYER-001";
      if (key === "pseudonymId") return "PLAYER-001";
      if (key === "diagnosedDate")
        return { toString: () => "2024-01-10T00:00:00.000Z" };
      if (key === "reportedBy") return "COACH-001";
      if (key === "statusUpdates") return [];
      return null;
    },
  };

  beforeAll(() => {
    // Mock console methods to reduce test output noise
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(async () => {
    // Create mock Neo4j session
    mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    } as any;

    // Create mock Neo4j driver
    mockNeo4jDriver = {
      session: jest.fn().mockReturnValue(mockSession),
      close: jest.fn(),
    } as any;

    // Create mock PostgreSQL pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InjuriesService,
        {
          provide: "NEO4J_DRIVER",
          useValue: mockNeo4jDriver,
        },
        {
          provide: "POSTGRES_POOL",
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<InjuriesService>(InjuriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createInjury", () => {
    it("should successfully create an injury for an existing player", async () => {
      const createDto: CreateInjuryDto = {
        playerId: "PLAYER-001",
        injuryType: "Hamstring Strain",
        bodyPart: "Hamstring",
        side: "Left",
        severity: "Moderate",
        injuryDate: "2024-01-10T00:00:00.000Z",
        expectedReturnDate: "2024-02-15T00:00:00.000Z",
        mechanism: "Overuse",
        diagnosis: "Grade 2 strain",
        treatmentPlan: "RICE protocol",
        notes: "Player reported during training",
      };

      // Mock player exists check
      mockSession.run
        .mockResolvedValueOnce(mockPlayerQuery(true) as any)
        // Mock generate injury ID check
        .mockResolvedValueOnce({ records: [] } as any)
        // Mock create injury
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any);

      // Mock PostgreSQL query for player identity
      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.createInjury(createDto, "COACH-001");

      expect(result).toBeDefined();
      expect(result.injuryId).toMatch(/^INJ-\d{4}-\d{3}$/);
      expect(mockSession.run).toHaveBeenCalledTimes(3);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw NotFoundException if player does not exist", async () => {
      const createDto: CreateInjuryDto = {
        playerId: "INVALID-PLAYER",
        injuryType: "Hamstring Strain",
        bodyPart: "Hamstring",
        severity: "Moderate",
        injuryDate: "2024-01-10T00:00:00.000Z",
      };

      // Mock player does not exist
      mockSession.run.mockResolvedValueOnce(mockPlayerQuery(false) as any);

      await expect(
        service.createInjury(createDto, "COACH-001"),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should generate sequential injury IDs", async () => {
      const createDto: CreateInjuryDto = {
        playerId: "PLAYER-001",
        injuryType: "Hamstring Strain",
        bodyPart: "Hamstring",
        severity: "Moderate",
        injuryDate: "2024-01-10T00:00:00.000Z",
      };

      // Mock player exists
      mockSession.run
        .mockResolvedValueOnce(mockPlayerQuery(true) as any)
        // Mock existing injury ID
        .mockResolvedValueOnce({
          records: [{ get: () => "INJ-2024-005" }],
        } as any)
        // Mock create injury
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any)
        // Mock findOne
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.createInjury(createDto, "COACH-001");

      // Verify the injury creation query includes the generated ID
      const createCalls = mockSession.run.mock.calls.filter((call) => {
        const query =
          typeof call[0] === "string" ? call[0] : (call[0] as any).text;
        return query.includes("CREATE (i:Injury");
      });
      expect(createCalls.length).toBeGreaterThan(0);
    });
  });

  describe("findOne", () => {
    it("should return injury details with player information", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockInjuryRecord],
      } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.findOne("INJ-2024-001");

      expect(result).toBeDefined();
      expect(result.injuryId).toBe("INJ-2024-001");
      expect(result.player).toBeDefined();
      expect(result.player.firstName).toBe("John");
      expect(result.player.lastName).toBe("Doe");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw NotFoundException if injury does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(service.findOne("INVALID-ID")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle injuries without player information", async () => {
      const recordWithoutPlayer = {
        get: (key: string) => {
          if (key === "i") return mockInjuryRecord.get("i");
          if (key === "playerId") return null;
          if (key === "statusUpdates") return [];
          return null;
        },
      };

      mockSession.run.mockResolvedValueOnce({
        records: [recordWithoutPlayer],
      } as any);

      const result = await service.findOne("INJ-2024-001");

      expect(result.player).toBeUndefined();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("updateInjury", () => {
    it("should update injury status and create status update", async () => {
      const updateDto: UpdateInjuryDto = {
        status: "Recovering",
        statusNote: "Patient showing good progress",
        treatmentPlan: "Continue PT",
      };

      mockSession.run
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any)
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.updateInjury(
        "INJ-2024-001",
        updateDto,
        "COACH-001",
      );

      expect(result).toBeDefined();
      expect(mockSession.run).toHaveBeenCalled();
      const updateCall = mockSession.run.mock.calls[0];
      expect(updateCall[0]).toContain("SET");
      expect(updateCall[0]).toContain("StatusUpdate");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should update injury without status change", async () => {
      const updateDto: UpdateInjuryDto = {
        treatmentPlan: "New treatment plan",
        notes: "Updated notes",
      };

      mockSession.run
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any)
        .mockResolvedValueOnce({ records: [mockInjuryRecord] } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.updateInjury(
        "INJ-2024-001",
        updateDto,
        "COACH-001",
      );

      expect(result).toBeDefined();
      const updateCall = mockSession.run.mock.calls[0];
      expect(updateCall[0]).not.toContain("StatusUpdate");
    });

    it("should throw NotFoundException if injury does not exist", async () => {
      const updateDto: UpdateInjuryDto = {
        status: "Recovering",
      };

      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.updateInjury("INVALID-ID", updateDto, "COACH-001"),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated injuries for admin role", async () => {
      const queryDto: QueryInjuriesDto = {
        page: 1,
        limit: 20,
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => ({ toNumber: () => 50 }) }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord, mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.findAll(queryDto, "admin", "ADMIN-001");

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should filter injuries for player role (own injuries only)", async () => {
      const queryDto: QueryInjuriesDto = {
        page: 1,
        limit: 20,
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => ({ toNumber: () => 5 }) }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.findAll(queryDto, "player", "PLAYER-001");

      const countQueryCall = mockSession.run.mock.calls[0];
      expect(countQueryCall[0]).toContain("p.pseudonymId = $userPseudonym");
      expect(countQueryCall[1].userPseudonym).toBe("PLAYER-001");
    });

    it("should filter injuries for coach role (team players only)", async () => {
      const queryDto: QueryInjuriesDto = {
        page: 1,
        limit: 20,
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => ({ toNumber: () => 15 }) }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.findAll(queryDto, "coach", "COACH-001");

      const countQueryCall = mockSession.run.mock.calls[0];
      expect(countQueryCall[0]).toContain("MANAGES");
      expect(countQueryCall[1].userPseudonym).toBe("COACH-001");
    });

    it("should apply status filter when provided", async () => {
      const queryDto: QueryInjuriesDto = {
        page: 1,
        limit: 20,
        status: "Active",
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => ({ toNumber: () => 10 }) }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      await service.findAll(queryDto, "admin", "ADMIN-001");

      const countQueryCall = mockSession.run.mock.calls[0];
      expect(countQueryCall[0]).toContain("i.status = $status");
      expect(countQueryCall[1].status).toBe("Active");
    });

    it("should apply severity filter when provided", async () => {
      const queryDto: QueryInjuriesDto = {
        page: 1,
        limit: 20,
        severity: "Severe",
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => ({ toNumber: () => 3 }) }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      await service.findAll(queryDto, "admin", "ADMIN-001");

      const countQueryCall = mockSession.run.mock.calls[0];
      expect(countQueryCall[0]).toContain("i.severity = $severity");
      expect(countQueryCall[1].severity).toBe("Severe");
    });
  });

  describe("resolveInjury", () => {
    it("should successfully resolve an active injury", async () => {
      const resolveDto: ResolveInjuryDto = {
        returnToPlayDate: "2024-02-20T00:00:00.000Z",
        resolutionNotes: "Fully recovered, cleared for play",
        medicalClearance: "Dr. Smith",
      };

      mockSession.run
        .mockResolvedValueOnce({
          records: [{ get: () => "Active" }],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any)
        .mockResolvedValueOnce({
          records: [mockInjuryRecord],
        } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PLAYER-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.resolveInjury(
        "INJ-2024-001",
        resolveDto,
        "COACH-001",
      );

      expect(result).toBeDefined();
      const resolveCall = mockSession.run.mock.calls[1];
      expect(resolveCall[0]).toContain("i.status = 'Recovered'");
      expect(resolveCall[0]).toContain("returnToPlayDate");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw NotFoundException if injury does not exist", async () => {
      const resolveDto: ResolveInjuryDto = {
        returnToPlayDate: "2024-02-20T00:00:00.000Z",
      };

      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.resolveInjury("INVALID-ID", resolveDto, "COACH-001"),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw BadRequestException if injury is already resolved", async () => {
      const resolveDto: ResolveInjuryDto = {
        returnToPlayDate: "2024-02-20T00:00:00.000Z",
      };

      mockSession.run.mockResolvedValueOnce({
        records: [{ get: () => "Recovered" }],
      } as any);

      await expect(
        service.resolveInjury("INJ-2024-001", resolveDto, "COACH-001"),
      ).rejects.toThrow(BadRequestException);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
