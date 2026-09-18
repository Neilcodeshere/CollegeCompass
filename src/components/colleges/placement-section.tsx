import { Table, TableWrapper, TdNumber, Th, ThNumber } from "@/components/ui/table";
import { formatPackage, formatPercent, formatRank } from "@/lib/format";
import type { Placement } from "@/types/api";

/** Year-by-year placement outcomes, most recent first. */
export function PlacementTable({ placements }: { placements: Placement[] }) {
  if (placements.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
        This college has not reported placement figures.
      </p>
    );
  }

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Year</Th>
            <ThNumber>Average</ThNumber>
            <ThNumber>Median</ThNumber>
            <ThNumber>Highest</ThNumber>
            <ThNumber>Placed</ThNumber>
            <ThNumber>Recruiters</ThNumber>
          </tr>
        </thead>
        <tbody>
          {placements.map((placement) => (
            <tr key={placement.year}>
              <Th scope="row" className="border-b text-sm font-medium text-neutral-900">
                {placement.year}
              </Th>
              <TdNumber>{formatPackage(placement.averagePackage)}</TdNumber>
              <TdNumber>{formatPackage(placement.medianPackage)}</TdNumber>
              <TdNumber>{formatPackage(placement.highestPackage)}</TdNumber>
              <TdNumber>{formatPercent(placement.placementRate)}</TdNumber>
              <TdNumber>{formatRank(placement.recruiterCount)}</TdNumber>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
