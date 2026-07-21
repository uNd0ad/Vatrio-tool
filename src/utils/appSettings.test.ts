import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, getAppSettings, saveAppSettings } from "./appSettings";

describe("appSettings", () => {
  beforeEach(() => localStorage.clear());

  it("pornește cu setările implicite", () => {
    expect(getAppSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("saveAppSettings face merge peste setările existente", () => {
    saveAppSettings({ enableDesktopNotifications: false });
    const s = getAppSettings();
    expect(s.enableDesktopNotifications).toBe(false);
    expect(s.crawlFrequencyMinutes).toBe(DEFAULT_SETTINGS.crawlFrequencyMinutes);
  });

  it("tolerează JSON corupt în storage", () => {
    localStorage.setItem("vatrio_app_settings_v1", "{corupt");
    expect(getAppSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
