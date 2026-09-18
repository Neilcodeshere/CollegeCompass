import { Table, TableWrapper, Td, TdNumber, Th, ThNumber } from "@/components/ui/table";
import { DEGREE_LABELS } from "@/lib/colleges/constants";
import { formatCurrency } from "@/lib/format";
import type { Course } from "@/types/api";

export function CoursesTable({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
        Course details are not available for this college.
      </p>
    );
  }

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Programme</Th>
            <Th>Degree</Th>
            <ThNumber>Duration</ThNumber>
            <ThNumber>Seats</ThNumber>
            <ThNumber>Annual fees</ThNumber>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <Td className="font-medium">{course.name}</Td>
              <Td className="text-neutral-600">{DEGREE_LABELS[course.degree]}</Td>
              <TdNumber className="text-neutral-600">
                {course.durationYears} {course.durationYears === 1 ? "year" : "years"}
              </TdNumber>
              <TdNumber className="text-neutral-600">
                {course.seats ?? <span className="text-neutral-400">—</span>}
              </TdNumber>
              <TdNumber>{formatCurrency(course.annualFees)}</TdNumber>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
