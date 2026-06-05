import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Redirect } from "wouter";
import { Shield, Users, Search, UserCheck, UserX, RefreshCw } from "lucide-react";
import type { User } from "@/types";

function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await api.get("/auth/admin/users/");
      return data;
    },
    retry: false,
  });
}

function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/summary/");
      return data;
    },
    retry: false,
  });
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { data: users, isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState("");

  if (!user?.is_staff) {
    return <Redirect to="/dashboard" />;
  }

  const userList = (users as User[] | undefined) ?? [];
  const filteredUsers = userList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" /> Admin Portal
          </h1>
          <p className="text-muted-foreground mt-1">Manage users and monitor platform activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: userList.length,
            icon: <Users className="w-4 h-4 text-blue-500" />,
            accent: "bg-blue-500/10",
          },
          {
            label: "Verified",
            value: userList.filter((u) => u.is_email_verified).length,
            icon: <UserCheck className="w-4 h-4 text-green-500" />,
            accent: "bg-green-500/10",
          },
          {
            label: "Unverified",
            value: userList.filter((u) => !u.is_email_verified).length,
            icon: <UserX className="w-4 h-4 text-orange-500" />,
            accent: "bg-orange-500/10",
          },
          {
            label: "Staff",
            value: userList.filter((u) => u.is_staff).length,
            icon: <Shield className="w-4 h-4 text-purple-500" />,
            accent: "bg-purple-500/10",
          },
        ].map(({ label, value, icon, accent }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Users
              </CardTitle>
              <CardDescription>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : filteredUsers.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {u.first_name?.charAt(0) ?? u.email?.charAt(0) ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-foreground">{u.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_email_verified ? "default" : "secondary"} className="text-xs">
                          {u.is_email_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_superuser ? (
                          <Badge className="text-xs bg-purple-500/20 text-purple-600 border-purple-500/30">Superuser</Badge>
                        ) : u.is_staff ? (
                          <Badge className="text-xs bg-blue-500/20 text-blue-600 border-blue-500/30">Staff</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted" />
              <p className="text-sm">
                {search ? "No users match your search." : "No users found or endpoint not available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
