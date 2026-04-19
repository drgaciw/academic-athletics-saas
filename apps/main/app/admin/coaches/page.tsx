'use client';

import { useState } from 'react';
import { DataTable, Badge, Button, SearchInput, Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Coach {
  id: string;
  coachId: string;
  name: string;
  email: string;
  sport: string;
  teams: string[];
  title?: string;
  phone?: string;
  createdAt: string;
}

// Mock data - will be replaced with actual API call
const mockCoaches: Coach[] = [
  {
    id: '1',
    coachId: 'C001',
    name: 'John Smith',
    email: 'john.smith@university.edu',
    sport: 'Basketball',
    teams: ['Men\'s Varsity', 'Men\'s JV'],
    title: 'Head Coach',
    phone: '555-0123',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    coachId: 'C002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    sport: 'Soccer',
    teams: ['Women\'s Varsity'],
    title: 'Head Coach',
    phone: '555-0124',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    coachId: 'C003',
    name: 'Michael Davis',
    email: 'michael.davis@university.edu',
    sport: 'Football',
    teams: ['Varsity'],
    title: 'Assistant Coach',
    phone: '555-0125',
    createdAt: '2024-03-10',
  },
];

const columns: ColumnDef<Coach>[] = [
  {
    accessorKey: 'name',
    header: 'Coach',
    cell: ({ row }: { row: any }) => {
      const coach = row.original as Coach;
      return (
        <div>
          <div className="font-medium">{coach.name}</div>
          <div className="text-sm text-muted-foreground">{coach.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'coachId',
    header: 'Coach ID',
  },
  {
    accessorKey: 'sport',
    header: 'Sport',
    cell: ({ row }: { row: any }) => {
      const sport = row.getValue('sport') as string;
      return <Badge variant="outline">{sport}</Badge>;
    },
  },
  {
    accessorKey: 'teams',
    header: 'Teams',
    cell: ({ row }: { row: any }) => {
      const teams = row.getValue('teams') as string[];
      return (
        <div className="flex gap-1 flex-wrap">
          {teams.map((team, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {team}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: { row: any }) => {
      const coach = row.original as Coach;
      return (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // TODO: Implement edit functionality
              console.log('Edit coach:', coach.coachId);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // TODO: Implement delete functionality
              if (confirm(`Are you sure you want to remove ${coach.name}?`)) {
                console.log('Delete coach:', coach.coachId);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      );
    },
  },
];

export default function CoachesManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [coaches] = useState<Coach[]>(mockCoaches);

  const filteredCoaches = coaches.filter((coach) =>
    coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coach Management</h1>
          <p className="text-muted-foreground">
            Manage coach accounts and team assignments
          </p>
        </div>
        <Button onClick={() => {
          // TODO: Implement create coach functionality
          console.log('Create new coach');
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coach
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coaches</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <SearchInput
              placeholder="Search coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              className="max-w-sm"
            />
          </div>

          {/* Coaches Table */}
          <DataTable
            columns={columns}
            data={filteredCoaches}
            paginated
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
