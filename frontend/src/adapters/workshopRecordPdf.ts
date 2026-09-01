import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createElement } from "react";
import { defer } from "rxjs";
import type { WorkshopRecordModel } from "../domain/workshopRecordModel";
import type { Single } from "../shared/reactiveTypes";

export function renderWorkshopRecordPdf(
  model: WorkshopRecordModel,
): Single<Blob> {
  return defer(() =>
    Promise.all([
      import("@react-pdf/renderer"),
      import("./WorkshopRecordDocument"),
    ]).then(([{ pdf }, { WorkshopRecordDocument }]) =>
      pdf(
        createElement(WorkshopRecordDocument, {
          model,
        }) as unknown as ReactElement<DocumentProps>,
      ).toBlob(),
    ),
  );
}
