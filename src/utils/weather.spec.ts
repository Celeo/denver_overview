import { describe, test, expect } from "vitest";
import {
  getRecommendedFlow,
  parseWeather,
  type AirportWeather,
} from "./weather";

describe("weather", () => {
  describe("parseWeather", () => {
    test("real", () => {
      const raw =
        "KDEN 291753Z 16006KT 10SM FEW055 SCT120 BKN180 20/07 A3032 RMK AO2 SLP193 T02000067 10200 20156 56009";
      const result = parseWeather(raw);

      expect(result.ceiling).toBe(18_000);
      expect(result.conditions).toBe("VFR");
      expect(result.visibility).toBe(10);
      expect(result.windDirection).toBe(160);
      expect(result.windMagnitude).toEqual([6, null]);
    });

    test("gusting", () => {
      const raw =
        "KDEN 291753Z 16006G30KT 10SM FEW055 SCT120 BKN180 20/07 A3032 RMK AO2 SLP193 T02000067 10200 20156 56009";
      const result = parseWeather(raw);

      expect(result.ceiling).toBe(18_000);
      expect(result.conditions).toBe("VFR");
      expect(result.visibility).toBe(10);
      expect(result.windDirection).toBe(160);
      expect(result.windMagnitude).toEqual([6, 30]);
    });

    test("variable", () => {
      const raw =
        "KDEN 291753Z VRB06G30KT 10SM FEW055 SCT120 BKN180 20/07 A3032 RMK AO2 SLP193 T02000067 10200 20156 56009";
      const result = parseWeather(raw);

      expect(result.ceiling).toBe(18_000);
      expect(result.conditions).toBe("VFR");
      expect(result.visibility).toBe(10);
      expect(result.windDirection).toBe("VRB");
      expect(result.windMagnitude).toEqual([6, 30]);
    });
  });

  describe("getRecommendedFlow", () => {
    test("default", () => {
      const result = getRecommendedFlow({
        windDirection: "VRB",
        windMagnitude: [1, null],
      } as AirportWeather);

      expect(result).toBe("North Calm");
    });

    test("South Calm", () => {
      const result = getRecommendedFlow({
        windDirection: 180,
        windMagnitude: [8, null],
      } as AirportWeather);

      expect(result).toBe("South Calm");
    });

    test("gusting", () => {
      const result = getRecommendedFlow({
        windDirection: 90,
        windMagnitude: [15, 30],
      } as AirportWeather);

      expect(result).toBe("East All");
    });
  });
});
