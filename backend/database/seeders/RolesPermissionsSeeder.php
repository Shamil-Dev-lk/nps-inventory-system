<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions
        $permissions = [
            // Settings
            'manage-settings',
            'manage-users',
            'manage-roles',
            'view-audit-log',

            // Items
            'view-items',
            'create-items',
            'edit-items',
            'delete-items',

            // Categories, Units, Brands
            'manage-categories',
            'manage-units',
            'manage-brands',
            'manage-suppliers',
            'manage-warehouses',
            'manage-departments',
            'manage-projects',

            // Purchase
            'view-purchase-requests',
            'create-purchase-requests',
            'approve-purchase-requests',
            'view-purchase-orders',
            'create-purchase-orders',
            'approve-purchase-orders',

            // GRN
            'view-grn',
            'create-grn',
            'approve-grn',

            // Stock Issues
            'view-stock-issues',
            'create-stock-issues',
            'approve-stock-issues',

            // Stock Returns
            'view-stock-returns',
            'create-stock-returns',
            'approve-stock-returns',

            // Stock Transfers
            'view-stock-transfers',
            'create-stock-transfers',
            'approve-stock-transfers',

            // Stock Adjustments
            'view-stock-adjustments',
            'create-stock-adjustments',
            'approve-stock-adjustments',

            // Stock Taking
            'view-stock-taking',
            'create-stock-taking',
            'approve-stock-taking',

            // Reports
            'view-reports',
            'export-reports',

            // AI
            'use-ai-features',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Define roles and their permissions
        $roles = [
            'super-admin' => $permissions, // All permissions

            'chairman' => [
                'view-items', 'view-purchase-requests', 'view-purchase-orders',
                'approve-purchase-requests', 'approve-purchase-orders',
                'view-grn', 'view-stock-issues', 'view-reports',
                'export-reports', 'view-audit-log', 'use-ai-features',
                'approve-stock-adjustments',
            ],

            'secretary' => [
                'view-items', 'edit-items',
                'view-purchase-requests', 'create-purchase-requests', 'approve-purchase-requests',
                'view-purchase-orders', 'create-purchase-orders', 'approve-purchase-orders',
                'view-grn', 'approve-grn',
                'view-stock-issues', 'approve-stock-issues',
                'view-stock-returns', 'approve-stock-returns',
                'view-stock-transfers', 'approve-stock-transfers',
                'view-stock-adjustments', 'approve-stock-adjustments',
                'view-stock-taking', 'approve-stock-taking',
                'manage-users', 'manage-suppliers',
                'view-reports', 'export-reports',
                'view-audit-log', 'use-ai-features',
            ],

            'administrative-officer' => [
                'view-items', 'create-items', 'edit-items',
                'manage-categories', 'manage-units', 'manage-brands',
                'manage-departments', 'manage-projects',
                'view-purchase-requests', 'create-purchase-requests',
                'view-purchase-orders',
                'view-grn', 'view-stock-issues',
                'view-reports', 'export-reports',
            ],

            'accountant' => [
                'view-items',
                'view-purchase-orders', 'view-grn',
                'view-stock-issues',
                'view-reports', 'export-reports',
                'manage-suppliers',
            ],

            'store-keeper' => [
                'view-items', 'create-items', 'edit-items',
                'manage-categories', 'manage-units', 'manage-brands',
                'manage-warehouses', 'manage-suppliers',
                'view-purchase-requests', 'create-purchase-requests',
                'view-purchase-orders',
                'view-grn', 'create-grn',
                'view-stock-issues', 'create-stock-issues',
                'view-stock-returns', 'create-stock-returns',
                'view-stock-transfers', 'create-stock-transfers',
                'view-stock-adjustments', 'create-stock-adjustments',
                'view-stock-taking', 'create-stock-taking',
                'view-reports', 'export-reports',
                'use-ai-features',
            ],

            'development-officer' => [
                'view-items',
                'view-purchase-requests', 'create-purchase-requests',
                'view-stock-issues',
                'view-reports',
            ],

            'technical-officer' => [
                'view-items',
                'view-purchase-requests', 'create-purchase-requests',
                'view-stock-issues', 'create-stock-issues',
                'view-reports',
            ],

            'revenue-officer' => [
                'view-items', 'view-reports',
            ],

            'phi' => [
                'view-items',
                'view-purchase-requests', 'create-purchase-requests',
                'view-reports',
            ],

            'driver' => [
                'view-items',
                'view-stock-issues',
            ],

            'officer' => [
                'view-items',
                'view-purchase-requests', 'create-purchase-requests',
                'view-stock-issues',
                'view-reports',
            ],

            'read-only' => [
                'view-items', 'view-reports',
            ],

            'guest' => [],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissions);
        }
    }
}
