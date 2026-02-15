import { Test, TestingModule } from "@nestjs/testing";
import { StatusService } from "./status.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { UpdateStatusDto, PlayerStatus } from "./dto/update-status.dto";

describe("StatusService", () => {
  let service: StatusService;
  let mockNeo4jDriver: jest.Mocked<Driver>;
  let mockSession: jest.Mocked<Session>;

  const mockPlayerExists = {
    records: [
      {
        get: () => ({
          properties: {
            pseudonymId: "PLAYER-001",
            playerId: "PLAYER-001",
            firstName: "John",
            lastName: "Doe",
          },
        }),
      },
    ],
  };

  const mockStatusUpdateResult = {
    records: [
      {
        get: (key: string) => {
          if (key === "s") {
            return {
              properties: {
                id: "status-uuid-123",
                status: "GREEN",
                date: { toString: () => "2026-02-15" },
                timestamp: { toString: () => "2026-02-15T10:30:00.000Z" },
                notes: "Feeling great today",
              },
            };
          }
          if (key === "playerId") return "PLAYER-001";
          if (key === "firstName") return "John";
          if (key === "lastName") return "Doe";
          return null;
        },
      },
    ],
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: "NEO4J_DRIVER",
          useValue: mockNeo4jDriver,
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updatePlayerStatus", () => {
    it("should successfully update player status to GREEN", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.GREEN,
        notes: "Feeling great today",
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce(mockStatusUpdateResult as any);

      const result = await service.updatePlayerStatus("PLAYER-001", updateDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe("GREEN");
      expect(result.data.playerId).toBe("PLAYER-001");
      expect(result.data.playerName).toBe("John Doe");
      expect(result.data.notes).toBe("Feeling great today");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should successfully update player status to ORANGE with notes", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.ORANGE,
        notes: "Slight hamstring tightness",
      };

      const orangeResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "s") {
                return {
                  properties: {
                    id: "status-uuid-456",
                    status: "ORANGE",
                    date: { toString: () => "2026-02-15" },
                    timestamp: { toString: () => "2026-02-15T10:30:00.000Z" },
                    notes: "Slight hamstring tightness",
                  },
                };
              }
              if (key === "playerId") return "PLAYER-001";
              if (key === "firstName") return "John";
              if (key === "lastName") return "Doe";
              return null;
            },
          },
        ],
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce(orangeResult as any);

      const result = await service.updatePlayerStatus("PLAYER-001", updateDto);

      expect(result.data.status).toBe("ORANGE");
      expect(result.data.notes).toBe("Slight hamstring tightness");
    });

    it("should successfully update player status to RED", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.RED,
        notes: "Injured, cannot train",
      };

      const redResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "s") {
                return {
                  properties: {
                    id: "status-uuid-789",
                    status: "RED",
                    date: { toString: () => "2026-02-15" },
                    timestamp: { toString: () => "2026-02-15T10:30:00.000Z" },
                    notes: "Injured, cannot train",
                  },
                };
              }
              if (key === "playerId") return "PLAYER-001";
              if (key === "firstName") return "John";
              if (key === "lastName") return "Doe";
              return null;
            },
          },
        ],
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce(redResult as any);

      const result = await service.updatePlayerStatus("PLAYER-001", updateDto);

      expect(result.data.status).toBe("RED");
    });

    it("should update player status without notes", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.GREEN,
      };

      const resultNoNotes = {
        records: [
          {
            get: (key: string) => {
              if (key === "s") {
                return {
                  properties: {
                    id: "status-uuid-123",
                    status: "GREEN",
                    date: { toString: () => "2026-02-15" },
                    timestamp: { toString: () => "2026-02-15T10:30:00.000Z" },
                    notes: null,
                  },
                };
              }
              if (key === "playerId") return "PLAYER-001";
              if (key === "firstName") return "John";
              if (key === "lastName") return "Doe";
              return null;
            },
          },
        ],
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce(resultNoNotes as any);

      const result = await service.updatePlayerStatus("PLAYER-001", updateDto);

      expect(result.data.notes).toBeNull();
    });

    it("should throw NotFoundException if player does not exist", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.GREEN,
      };

      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.updatePlayerStatus("INVALID-PLAYER", updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw BadRequestException if status creation fails", async () => {
      const updateDto: UpdateStatusDto = {
        status: PlayerStatus.GREEN,
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.updatePlayerStatus("PLAYER-001", updateDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("getLatestTeamStatuses", () => {
    it("should return team statuses for coach with player status counts", async () => {
      const mockTeamStatusResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "teamId") return "TEAM-001";
              if (key === "teamName") return "Senior Football";
              if (key === "sport") return "Gaelic Football";
              if (key === "players") {
                return [
                  {
                    playerId: "P1",
                    firstName: "John",
                    lastName: "Doe",
                    currentStatus: "GREEN",
                    statusNotes: "Good",
                    lastUpdated: "2026-02-15",
                    activeInjuryCount: { toNumber: () => 0 },
                  },
                  {
                    playerId: "P2",
                    firstName: "Jane",
                    lastName: "Smith",
                    currentStatus: "ORANGE",
                    statusNotes: "Minor issue",
                    lastUpdated: "2026-02-15",
                    activeInjuryCount: { toNumber: () => 1 },
                  },
                  {
                    playerId: "P3",
                    firstName: "Bob",
                    lastName: "Wilson",
                    currentStatus: "RED",
                    statusNotes: "Injured",
                    lastUpdated: "2026-02-15",
                    activeInjuryCount: { toNumber: () => 2 },
                  },
                  {
                    playerId: "P4",
                    firstName: "Alice",
                    lastName: "Brown",
                    currentStatus: "UNKNOWN",
                    statusNotes: null,
                    lastUpdated: null,
                    activeInjuryCount: { toNumber: () => 0 },
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockTeamStatusResult as any);

      const result = await service.getLatestTeamStatuses("COACH-001");

      expect(result).toBeDefined();
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].teamId).toBe("TEAM-001");
      expect(result.teams[0].players).toHaveLength(4);
      expect(result.teams[0].statusCounts.green).toBe(1);
      expect(result.teams[0].statusCounts.orange).toBe(1);
      expect(result.teams[0].statusCounts.red).toBe(1);
      expect(result.teams[0].statusCounts.noStatus).toBe(1);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle multiple teams managed by coach", async () => {
      const mockMultiTeamResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "teamId") return "TEAM-001";
              if (key === "teamName") return "Senior Football";
              if (key === "sport") return "Gaelic Football";
              if (key === "players") {
                return [
                  {
                    playerId: "P1",
                    firstName: "John",
                    lastName: "Doe",
                    currentStatus: "GREEN",
                    activeInjuryCount: { toNumber: () => 0 },
                  },
                ];
              }
              return null;
            },
          },
          {
            get: (key: string) => {
              if (key === "teamId") return "TEAM-002";
              if (key === "teamName") return "U21 Football";
              if (key === "sport") return "Gaelic Football";
              if (key === "players") {
                return [
                  {
                    playerId: "P2",
                    firstName: "Jane",
                    lastName: "Smith",
                    currentStatus: "ORANGE",
                    activeInjuryCount: { toNumber: () => 1 },
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockMultiTeamResult as any);

      const result = await service.getLatestTeamStatuses("COACH-001");

      expect(result.teams).toHaveLength(2);
      expect(result.teams[0].teamId).toBe("TEAM-001");
      expect(result.teams[1].teamId).toBe("TEAM-002");
    });

    it("should return empty teams array if coach manages no teams", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      const result = await service.getLatestTeamStatuses("COACH-999");

      expect(result.teams).toHaveLength(0);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle activeInjuryCount without toNumber method", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "teamId") return "TEAM-001";
              if (key === "teamName") return "Senior Football";
              if (key === "sport") return "Gaelic Football";
              if (key === "players") {
                return [
                  {
                    playerId: "P1",
                    firstName: "John",
                    lastName: "Doe",
                    currentStatus: "GREEN",
                    activeInjuryCount: 2, // Direct number, not Neo4j Integer
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.getLatestTeamStatuses("COACH-001");

      expect(result.teams[0].players[0].activeInjuryCount).toBe(2);
    });

    it("should throw BadRequestException on database error", async () => {
      mockSession.run.mockRejectedValue(new Error("Neo4j connection failed"));

      await expect(service.getLatestTeamStatuses("COACH-001")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe("getPlayerStatusHistory", () => {
    it("should return status history for player", async () => {
      const mockHistoryResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "id") return "status-1";
              if (key === "status") return "GREEN";
              if (key === "date") return { toString: () => "2026-02-15" };
              if (key === "timestamp")
                return { toString: () => "2026-02-15T10:30:00.000Z" };
              if (key === "notes") return "Feeling great";
              return null;
            },
          },
          {
            get: (key: string) => {
              if (key === "id") return "status-2";
              if (key === "status") return "ORANGE";
              if (key === "date") return { toString: () => "2026-02-14" };
              if (key === "timestamp")
                return { toString: () => "2026-02-14T10:30:00.000Z" };
              if (key === "notes") return "Minor issue";
              return null;
            },
          },
        ],
      };

      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce(mockHistoryResult as any);

      const result = await service.getPlayerStatusHistory("PLAYER-001");

      expect(result).toBeDefined();
      expect(result.playerId).toBe("PLAYER-001");
      expect(result.statusHistory).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.statusHistory[0].status).toBe("GREEN");
      expect(result.statusHistory[1].status).toBe("ORANGE");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return empty history if player has no status updates", async () => {
      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockResolvedValueOnce({ records: [] } as any);

      const result = await service.getPlayerStatusHistory("PLAYER-001");

      expect(result.statusHistory).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should throw NotFoundException if player does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.getPlayerStatusHistory("INVALID-PLAYER"),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw BadRequestException on database error", async () => {
      mockSession.run
        .mockResolvedValueOnce(mockPlayerExists as any)
        .mockRejectedValue(new Error("Neo4j query failed"));

      await expect(
        service.getPlayerStatusHistory("PLAYER-001"),
      ).rejects.toThrow(BadRequestException);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
