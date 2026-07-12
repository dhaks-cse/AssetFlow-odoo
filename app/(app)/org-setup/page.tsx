import { redirect } from "next/navigation";

import { requireRole } from "@/lib/rbac";
import { getDepartments, getCategories, getEmployeeDirectory, getEmployeesForHeadSelect } from "@/lib/queries/org";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentDialog } from "@/components/org/department-dialog";
import { CategoryDialog } from "@/components/org/category-dialog";
import { EmployeeRoleSelect, EmployeeStatusSelect } from "@/components/org/employee-role-select";

export default async function OrgSetupPage() {
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/");
  }

  const [departments, categories, employees, headCandidates] = await Promise.all([
    getDepartments(),
    getCategories(),
    getEmployeeDirectory(),
    getEmployeesForHeadSelect(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Setup</h1>
        <p className="text-sm text-muted-foreground">
          The master data everything else depends on. Admin only.
        </p>
      </div>

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Asset Categories</TabsTrigger>
          <TabsTrigger value="employees">Employee Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <DepartmentDialog employees={headCandidates} />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No departments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.code}</TableCell>
                      <TableCell className="text-muted-foreground">{d.head?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{d._count.employees}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "ACTIVE" ? "secondary" : "outline"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DepartmentDialog
                          employees={headCandidates}
                          department={{
                            id: d.id,
                            name: d.name,
                            code: d.code,
                            headId: d.headId,
                            status: d.status,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <CategoryDialog />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No categories yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c._count.assets}</TableCell>
                      <TableCell className="text-right">
                        <CategoryDialog category={{ id: c.id, name: c.name }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            The only place roles are assigned — signup always creates an Employee.
          </p>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No employees yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.department?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <EmployeeRoleSelect employeeId={e.id} role={e.role} />
                      </TableCell>
                      <TableCell>
                        <EmployeeStatusSelect employeeId={e.id} status={e.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
