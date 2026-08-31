import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WorkshopRecordModel } from "../domain/workshopRecordModel";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: {
    marginBottom: 24,
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
  },
  heading: {
    marginBottom: 16,
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  entry: {
    marginBottom: 14,
  },
  entryLabel: {
    fontSize: 10,
  },
  entryName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
});

export function WorkshopRecordDocument({
  model,
}: {
  model: WorkshopRecordModel;
}) {
  return (
    <Document title={model.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.heading}>{model.winnersHeading}</Text>
        {model.winners.map((winner) => (
          <View key={winner.placeLabel} style={styles.entry}>
            <Text style={styles.entryLabel}>{winner.placeLabel}</Text>
            <Text style={styles.entryName}>{winner.valueName}</Text>
            <Text style={styles.entryLabel}>{winner.votesLine}</Text>
            {winner.actions.map((action, actionIndex) => (
              <Text key={actionIndex}>{action}</Text>
            ))}
          </View>
        ))}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{model.allActionsHeading}</Text>
        {model.values.map((value) => (
          <View key={value.valueName} style={styles.entry}>
            <Text style={styles.entryName}>{value.valueName}</Text>
            {value.actions.map((action, actionIndex) => (
              <Text key={actionIndex}>{action}</Text>
            ))}
          </View>
        ))}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{model.roundsHeading}</Text>
        {model.rounds.map((round) => (
          <View key={round.title} style={styles.entry}>
            <Text style={styles.entryName}>{round.title}</Text>
            {round.tallyLines.map((tallyLine, tallyLineIndex) => (
              <Text key={tallyLineIndex}>{tallyLine}</Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
