import {
  architectureSection,
  complexitySection,
  duplicationSection,
  securitySection,
  supplyChainSection,
  testsSection,
} from "./metricsGateSections.mts";
import { hotspotsSection } from "./metricsHotspotsSection.mts";
import { mutationSection } from "./metricsMutationSection.mts";
import {
  contractSection,
  designSystemSection,
  header,
  processSection,
  sizeSection,
} from "./metricsSourceSections.mts";
import type { QualityReport } from "./qualityReport.mts";

export function renderMetricsMarkdown(report: QualityReport): string {
  return `${[
    header(report),
    sizeSection(report),
    testsSection(report),
    complexitySection(report),
    duplicationSection(report),
    hotspotsSection(report),
    architectureSection(report),
    designSystemSection(report),
    contractSection(report),
    mutationSection(report),
    securitySection(report),
    supplyChainSection(report),
    processSection(report),
  ].join("\n\n")}\n`;
}
