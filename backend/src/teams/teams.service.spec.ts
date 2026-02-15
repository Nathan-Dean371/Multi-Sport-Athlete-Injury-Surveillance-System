import { Test, TestingModule } from "@nestjs/testing";
import { TeamsService } from "./teams.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { Pool } from "pg";
import { PlayerStatus } from "../status/dto/update-status.dto";

describe("TeamsService", () => {
  let service: TeamsService;
  let mockNeo4jDriver: jest.Mocked<Driver>;
  let mockSession: jest.Mocked<Session>;
  let mockPool: jest.Mocked<Pool>;

  const mockRosterRecord = {
    get: (key: string) => {
      if (key === "teamId") return "TEAM-001";
      if (key === "teamName") return "Senior Gaelic Football";
      if (key === "sport") return "Gaelic Football";
      if (key === "players")
        return [
          {
            playerId: "PLAYER-001",
            pseudonymId: "PSY-001",
            position: "Forward",
            currentStatus: "GREEN",
            statusNotes: "Feeling great",
            lastStatusUpdate: "2026-02-15",
            activeInjuryCount: { toNumber: () => 0 },
          },
          {
            playerId: "PLAYER-002",
            pseudonymId: "PSY-002",
            position: "Defender",
            currentStatus: "AMBER",
            statusNotes: "Minor soreness",
            lastStatusUpdate: "2026-02-15",
            activeInjuryCount: { toNumber: () => 1 },
          },
        ];
      if (key === "totalPlayers") return { toNumber: () => 2 };
      if (key === "playersReportedToday") return { toNumber: () => 2 };
      return null;
    },
  };

  const mockTeamDetailsRecord = {
    get: (key: string) => {
      if (key === "teamId") return "TEAM-001";
      if (key === "name") return "Senior Gaelic Football";
      if (key === "sport") return "Gaelic Football";
      if (key === "ageGroup") return "Senior";
      if (key === "gender") return "Male";
      if (key === "organizationId") return "ORG-001";
      if (key === "organizationName") return "Dublin GAA";
      if (key === "coaches")
        return [
          {
            coachId: "COACH-001",
            pseudonymId: "PSY-COACH-001",
            specialization: "Strength & Conditioning",
          },
        ];
      if (key === "playerCount") return { toNumber: () => 25 };
      if (key === "seasonStart") return "2024-09-01";
      if (key === "seasonEnd") return "2025-05-31";
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
        TeamsService,
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

    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamRoster", () => {
    it("should return team roster with player details", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockRosterRecord],
      } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PSY-001", first_name: "John", last_name: "Doe" },
          { pseudonym_id: "PSY-002", first_name: "Jane", last_name: "Smith" },
        ],
      } as any);

      const result = await service.getTeamRoster("TEAM-001");

      expect(result).toBeDefined();
      expect(result.teamId).toBe("TEAM-001");
      expect(result.teamName).toBe("Senior Gaelic Football");
      expect(result.players).toHaveLength(2);
      expect(result.totalPlayers).toBe(2);
      expect(result.playersReportedToday).toBe(2);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should merge player identities from PostgreSQL", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockRosterRecord],
      } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PSY-001", first_name: "John", last_name: "Doe" },
          { pseudonym_id: "PSY-002", first_name: "Jane", last_name: "Smith" },
        ],
      } as any);

      const result = await service.getTeamRoster("TEAM-001");

      expect(result.players[0].firstName).toBe("John"); // Doe comes before Smith alphabetically
      expect(result.players[0].lastName).toBe("Doe");
      expect(result.players[1].firstName).toBe("Jane");
      expect(result.players[1].lastName).toBe("Smith");
    });

    it("should sort players alphabetically by last name then first name", async () => {
      const multiPlayerRecord = {
        get: (key: string) => {
          if (key === "teamId") return "TEAM-001";
          if (key === "teamName") return "Senior Football";
          if (key === "sport") return "Football";
          if (key === "players")
            return [
              {
                playerId: "P1",
                pseudonymId: "PSY-1",
                position: "Forward",
                activeInjuryCount: { toNumber: () => 0 },
              },
              {
                playerId: "P2",
                pseudonymId: "PSY-2",
                position: "Defender",
                activeInjuryCount: { toNumber: () => 0 },
              },
              {
                playerId: "P3",
                pseudonymId: "PSY-3",
                position: "Midfielder",
                activeInjuryCount: { toNumber: () => 0 },
              },
            ];
          if (key === "totalPlayers") return { toNumber: () => 3 };
          if (key === "playersReportedToday") return { toNumber: () => 3 };
          return null;
        },
      };

      mockSession.run.mockResolvedValueOnce({
        records: [multiPlayerRecord],
      } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PSY-1", first_name: "Charlie", last_name: "Brown" },
          { pseudonym_id: "PSY-2", first_name: "Alice", last_name: "Smith" },
          { pseudonym_id: "PSY-3", first_name: "Bob", last_name: "Brown" },
        ],
      } as any);

      const result = await service.getTeamRoster("TEAM-001");

      expect(result.players[0].lastName).toBe("Brown");
      expect(result.players[0].firstName).toBe("Bob");
      expect(result.players[1].lastName).toBe("Brown");
      expect(result.players[1].firstName).toBe("Charlie");
      expect(result.players[2].lastName).toBe("Smith");
      expect(result.players[2].firstName).toBe("Alice");
    });

    it("should assign jersey numbers in order after sorting", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockRosterRecord],
      } as any);

      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PSY-001", first_name: "John", last_name: "Doe" },
          { pseudonym_id: "PSY-002", first_name: "Jane", last_name: "Smith" },
        ],
      } as any);

      const result = await service.getTeamRoster("TEAM-001");

      expect(result.players[0].jerseyNumber).toBe("1");
      expect(result.players[1].jerseyNumber).toBe("2");
    });

    it("should handle missing player identities gracefully", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockRosterRecord],
      } as any);

      // PostgreSQL returns only one identity
      mockPool.query.mockResolvedValue({
        rows: [
          { pseudonym_id: "PSY-001", first_name: "John", last_name: "Doe" },
        ],
      } as any);

      const result = await service.getTeamRoster("TEAM-001");

      expect(result.players).toHaveLength(2);
      expect(result.players.some((p) => p.firstName === "Unknown")).toBe(true);
      expect(result.players.some((p) => p.lastName === "Player")).toBe(true);
    });

    it("should throw NotFoundException if team does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      } as any);

      await expect(service.getTeamRoster("INVALID-TEAM")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle PostgreSQL query errors gracefully", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockRosterRecord],
      } as any);

      mockPool.query.mockRejectedValue(new Error("Database connection failed"));

      const result = await service.getTeamRoster("TEAM-001");

      // Should return roster with default names
      expect(result.players[0].firstName).toBe("Unknown");
      expect(result.players[0].lastName).toBe("Player");
    });
  });

  describe("getTeamDetails", () => {
    it("should return team details with coaches", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockTeamDetailsRecord],
      } as any);

      const result = await service.getTeamDetails("TEAM-001");

      expect(result).toBeDefined();
      expect(result.teamId).toBe("TEAM-001");
      expect(result.name).toBe("Senior Gaelic Football");
      expect(result.sport).toBe("Gaelic Football");
      expect(result.coaches).toHaveLength(1);
      expect(result.coaches[0].coachId).toBe("COACH-001");
      expect(result.playerCount).toBe(25);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle teams with no coaches", async () => {
      const recordNoCoaches = {
        get: (key: string) => {
          if (key === "coaches")
            return [{ coachId: null, pseudonymId: null, specialization: null }];
          return mockTeamDetailsRecord.get(key);
        },
      };

      mockSession.run.mockResolvedValueOnce({
        records: [recordNoCoaches],
      } as any);

      const result = await service.getTeamDetails("TEAM-001");

      expect(result.coaches).toHaveLength(0);
    });

    it("should throw NotFoundException if team does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      } as any);

      await expect(service.getTeamDetails("INVALID-TEAM")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should include season information", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [mockTeamDetailsRecord],
      } as any);

      const result = await service.getTeamDetails("TEAM-001");

      expect(result.seasonStart).toBe("2024-09-01");
      expect(result.seasonEnd).toBe("2025-05-31");
    });
  });

  describe("verifyCoachAccess", () => {
    it("should return true if coach has access to team", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [{ get: () => true }],
      } as any);

      const result = await service.verifyCoachAccess(
        "PSY-COACH-001",
        "TEAM-001",
      );

      expect(result).toBe(true);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return false if coach does not have access to team", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [{ get: () => false }],
      } as any);

      const result = await service.verifyCoachAccess(
        "PSY-COACH-001",
        "TEAM-999",
      );

      expect(result).toBe(false);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return false if no records are returned", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      } as any);

      const result = await service.verifyCoachAccess(
        "PSY-COACH-001",
        "TEAM-001",
      );

      expect(result).toBe(false);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return false on database error", async () => {
      mockSession.run.mockRejectedValue(new Error("Neo4j connection failed"));

      const result = await service.verifyCoachAccess(
        "PSY-COACH-001",
        "TEAM-001",
      );

      expect(result).toBe(false);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("getCoachTeams", () => {
    it("should return all teams managed by coach", async () => {
      const mockCoachTeamsRecords = [
        {
          get: (key: string) => {
            if (key === "teamId") return "TEAM-001";
            if (key === "name") return "Senior Football";
            if (key === "sport") return "Gaelic Football";
            if (key === "ageGroup") return "Senior";
            if (key === "gender") return "Male";
            if (key === "organizationId") return "ORG-001";
            if (key === "organizationName") return "Dublin GAA";
            if (key === "playerCount") return { toNumber: () => 25 };
            if (key === "seasonStart") return "2024-09-01";
            if (key === "seasonEnd") return "2025-05-31";
            return null;
          },
        },
        {
          get: (key: string) => {
            if (key === "teamId") return "TEAM-002";
            if (key === "name") return "U21 Football";
            if (key === "sport") return "Gaelic Football";
            if (key === "ageGroup") return "U21";
            if (key === "gender") return "Male";
            if (key === "organizationId") return "ORG-001";
            if (key === "organizationName") return "Dublin GAA";
            if (key === "playerCount") return { toNumber: () => 20 };
            if (key === "seasonStart") return "2024-09-01";
            if (key === "seasonEnd") return "2025-05-31";
            return null;
          },
        },
      ];

      mockSession.run.mockResolvedValueOnce({
        records: mockCoachTeamsRecords,
      } as any);

      const result = await service.getCoachTeams("PSY-COACH-001");

      expect(result).toHaveLength(2);
      expect(result[0].teamId).toBe("TEAM-001");
      expect(result[0].name).toBe("Senior Football");
      expect(result[0].playerCount).toBe(25);
      expect(result[1].teamId).toBe("TEAM-002");
      expect(result[1].name).toBe("U21 Football");
      expect(result[1].playerCount).toBe(20);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return empty array if coach manages no teams", async () => {
      mockSession.run.mockResolvedValueOnce({
        records: [],
      } as any);

      const result = await service.getCoachTeams("PSY-COACH-999");

      expect(result).toHaveLength(0);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should not include coaches array in list view", async () => {
      const mockRecord = {
        get: (key: string) => {
          if (key === "teamId") return "TEAM-001";
          if (key === "name") return "Senior Football";
          if (key === "sport") return "Gaelic Football";
          if (key === "playerCount") return { toNumber: () => 25 };
          if (key === "organizationId") return "ORG-001";
          if (key === "organizationName") return "Dublin GAA";
          return null;
        },
      };

      mockSession.run.mockResolvedValueOnce({
        records: [mockRecord],
      } as any);

      const result = await service.getCoachTeams("PSY-COACH-001");

      expect(result[0].coaches).toEqual([]);
    });

    it("should throw BadRequestException on database error", async () => {
      mockSession.run.mockRejectedValue(new Error("Neo4j connection failed"));

      await expect(service.getCoachTeams("PSY-COACH-001")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
