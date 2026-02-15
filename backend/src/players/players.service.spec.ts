import { Test, TestingModule } from "@nestjs/testing";
import { PlayersService } from "./players.service";
import { NotFoundException } from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";

describe("PlayersService", () => {
  let service: PlayersService;
  let mockNeo4jDriver: jest.Mocked<Driver>;
  let mockSession: jest.Mocked<Session>;

  const mockPlayerProperties = {
    playerId: "PLAYER-001",
    name: "John Doe",
    position: "Forward",
    jerseyNumber: "10",
    dateOfBirth: "1995-06-15",
    ageGroup: "Senior",
    isActive: true,
  };

  const mockInjuryProperties = {
    injuryId: "INJ-2024-001",
    injuryType: "Hamstring Strain",
    bodyPart: "Hamstring",
    side: "Left",
    severity: "Moderate",
    status: "Recovering",
    injuryDate: { toString: () => "2024-01-10T00:00:00.000Z" },
    expectedReturnDate: { toString: () => "2024-02-15T00:00:00.000Z" },
    actualReturnDate: null,
    mechanism: "Overuse",
    diagnosis: "Grade 2 strain",
    treatmentPlan: "RICE protocol",
    notes: "Good progress",
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
        PlayersService,
        {
          provide: "NEO4J_DRIVER",
          useValue: mockNeo4jDriver,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all players with team names", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamName") return "Red Devils";
              return null;
            },
          },
          {
            get: (key: string) => {
              if (key === "p") {
                return {
                  properties: {
                    playerId: "PLAYER-002",
                    name: "Jane Smith",
                    position: "Defender",
                    dateOfBirth: "1997-03-20",
                    ageGroup: "U21",
                    isActive: true,
                  },
                };
              }
              if (key === "teamName") return "Blue Eagles";
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result.players).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.players[0].playerId).toBe("PLAYER-001");
      expect(result.players[0].name).toBe("John Doe");
      expect(result.players[0].teamName).toBe("Red Devils");
      expect(result.players[1].playerId).toBe("PLAYER-002");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should handle players without teams", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamName") return null;
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findAll();

      expect(result.players[0].teamName).toBeNull();
    });

    it("should return empty list if no players exist", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      const result = await service.findAll();

      expect(result.players).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should map all player properties correctly", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamName") return "Red Devils";
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findAll();

      const player = result.players[0];
      expect(player.playerId).toBe("PLAYER-001");
      expect(player.name).toBe("John Doe");
      expect(player.position).toBe("Forward");
      expect(player.dateOfBirth).toBe("1995-06-15");
      expect(player.ageGroup).toBe("Senior");
      expect(player.isActive).toBe(true);
    });
  });

  describe("findOne", () => {
    it("should return a single player with team information", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamId") return "TEAM-001";
              if (key === "teamName") return "Red Devils";
              if (key === "sport") return "Soccer";
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findOne("PLAYER-001");

      expect(result).toBeDefined();
      expect(result.playerId).toBe("PLAYER-001");
      expect(result.name).toBe("John Doe");
      expect(result.teamId).toBe("TEAM-001");
      expect(result.teamName).toBe("Red Devils");
      expect(result.team).toBeDefined();
      expect(result.team?.teamId).toBe("TEAM-001");
      expect(result.team?.sport).toBe("Soccer");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return player without team if not assigned to one", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamId") return null;
              if (key === "teamName") return null;
              if (key === "sport") return null;
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findOne("PLAYER-001");

      expect(result.playerId).toBe("PLAYER-001");
      expect(result.team).toBeUndefined();
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should throw NotFoundException if player does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(service.findOne("INVALID-PLAYER")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should include all player details in response", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "teamId") return "TEAM-001";
              if (key === "teamName") return "Red Devils";
              if (key === "sport") return "Soccer";
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findOne("PLAYER-001");

      expect(result.position).toBe("Forward");
      expect(result.jerseyNumber).toBe("10");
      expect(result.dateOfBirth).toBe("1995-06-15");
      expect(result.ageGroup).toBe("Senior");
      expect(result.isActive).toBe(true);
    });
  });

  describe("findPlayerInjuries", () => {
    it("should return all injuries for a player", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "injuries") {
                return [
                  {
                    injury: { properties: mockInjuryProperties },
                    diagnosedDate: {
                      toString: () => "2024-01-10T10:30:00.000Z",
                    },
                    reportedBy: "COACH-001",
                  },
                  {
                    injury: {
                      properties: {
                        injuryId: "INJ-2024-002",
                        injuryType: "Ankle Sprain",
                        bodyPart: "Ankle",
                        side: "Right",
                        severity: "Minor",
                        status: "Recovered",
                        injuryDate: {
                          toString: () => "2023-12-01T00:00:00.000Z",
                        },
                        expectedReturnDate: {
                          toString: () => "2023-12-20T00:00:00.000Z",
                        },
                        actualReturnDate: {
                          toString: () => "2023-12-18T00:00:00.000Z",
                        },
                        mechanism: "Contact",
                        diagnosis: "Grade 1 sprain",
                        treatmentPlan: "Rest and ice",
                        notes: "Quick recovery",
                      },
                    },
                    diagnosedDate: {
                      toString: () => "2023-12-01T09:00:00.000Z",
                    },
                    reportedBy: "COACH-002",
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findPlayerInjuries("PLAYER-001");

      expect(result).toBeDefined();
      expect(result.playerId).toBe("PLAYER-001");
      expect(result.playerName).toBe("John Doe");
      expect(result.injuries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.injuries[0].injuryId).toBe("INJ-2024-001");
      expect(result.injuries[1].injuryId).toBe("INJ-2024-002");
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should return empty injuries list if player has no injuries", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "injuries") return [];
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findPlayerInjuries("PLAYER-001");

      expect(result.injuries).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should filter out null injuries from OPTIONAL MATCH", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "injuries") {
                return [
                  {
                    injury: { properties: mockInjuryProperties },
                    diagnosedDate: {
                      toString: () => "2024-01-10T10:30:00.000Z",
                    },
                    reportedBy: "COACH-001",
                  },
                  {
                    injury: null,
                    diagnosedDate: null,
                    reportedBy: null,
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findPlayerInjuries("PLAYER-001");

      expect(result.injuries).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should throw NotFoundException if player does not exist", async () => {
      mockSession.run.mockResolvedValueOnce({ records: [] } as any);

      await expect(
        service.findPlayerInjuries("INVALID-PLAYER"),
      ).rejects.toThrow(NotFoundException);
      expect(mockSession.close).toHaveBeenCalled();
    });

    it("should map all injury properties correctly", async () => {
      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "injuries") {
                return [
                  {
                    injury: { properties: mockInjuryProperties },
                    diagnosedDate: {
                      toString: () => "2024-01-10T10:30:00.000Z",
                    },
                    reportedBy: "COACH-001",
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findPlayerInjuries("PLAYER-001");

      const injury = result.injuries[0];
      expect(injury.injuryId).toBe("INJ-2024-001");
      expect(injury.injuryType).toBe("Hamstring Strain");
      expect(injury.bodyPart).toBe("Hamstring");
      expect(injury.side).toBe("Left");
      expect(injury.severity).toBe("Moderate");
      expect(injury.status).toBe("Recovering");
      expect(injury.mechanism).toBe("Overuse");
      expect(injury.diagnosis).toBe("Grade 2 strain");
      expect(injury.treatmentPlan).toBe("RICE protocol");
      expect(injury.notes).toBe("Good progress");
      expect(injury.diagnosedDate).toBe("2024-01-10T10:30:00.000Z");
      expect(injury.reportedBy).toBe("COACH-001");
    });

    it("should handle injuries with missing optional fields", async () => {
      const minimalInjury = {
        injuryId: "INJ-2024-003",
        injuryType: "Cut",
        bodyPart: "Hand",
        severity: "Minor",
        status: "Active",
        injuryDate: { toString: () => "2024-02-01T00:00:00.000Z" },
        expectedReturnDate: null,
        actualReturnDate: null,
        mechanism: null,
        diagnosis: null,
        treatmentPlan: null,
        notes: null,
        side: null,
      };

      const mockResult = {
        records: [
          {
            get: (key: string) => {
              if (key === "p") return { properties: mockPlayerProperties };
              if (key === "injuries") {
                return [
                  {
                    injury: { properties: minimalInjury },
                    diagnosedDate: null,
                    reportedBy: null,
                  },
                ];
              }
              return null;
            },
          },
        ],
      };

      mockSession.run.mockResolvedValueOnce(mockResult as any);

      const result = await service.findPlayerInjuries("PLAYER-001");

      const injury = result.injuries[0];
      expect(injury.injuryId).toBe("INJ-2024-003");
      expect(injury.expectedReturnDate).toBeUndefined();
      expect(injury.actualReturnDate).toBeUndefined();
      expect(injury.diagnosedDate).toBeUndefined();
    });
  });
});
