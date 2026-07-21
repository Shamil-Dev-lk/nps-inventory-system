<?php

use App\Http\Controllers\Api\V1\AI\AiController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Inventory\ItemController;
use App\Http\Controllers\Api\V1\Purchase\PurchaseOrderController;
use App\Http\Controllers\Api\V1\Purchase\PurchaseRequestController;
use App\Http\Controllers\Api\V1\Reports\ReportController;
use App\Http\Controllers\Api\V1\Settings\AuditLogController;
use App\Http\Controllers\Api\V1\Settings\DepartmentController;
use App\Http\Controllers\Api\V1\Settings\OrganizationController;
use App\Http\Controllers\Api\V1\Settings\ProjectController;
use App\Http\Controllers\Api\V1\Settings\RoleController;
use App\Http\Controllers\Api\V1\Settings\SupplierController;
use App\Http\Controllers\Api\V1\Settings\UserController;
use App\Http\Controllers\Api\V1\Settings\WarehouseController;
use App\Http\Controllers\Api\V1\Stock\GrnController;
use App\Http\Controllers\Api\V1\Stock\StockAdjustmentController;
use App\Http\Controllers\Api\V1\Stock\StockIssueController;
use App\Http\Controllers\Api\V1\Stock\StockReturnController;
use App\Http\Controllers\Api\V1\Stock\StockTakingController;
use App\Http\Controllers\Api\V1\Stock\StockTransferController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ANTIGRAVITY API Routes — Government Store Management System
| Version: 1.0 | Base Prefix: /api/v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::post('/search/scan', [\App\Http\Controllers\Api\V1\Search\ScanController::class, 'scan']);

    // ── PUBLIC: Organization info ─────────────────────────────────
    Route::get('organization', [OrganizationController::class, 'show']);

    // ── AUTH ──────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login',        [AuthController::class, 'login']);
        Route::post('login/2fa',    [AuthController::class, 'verify2fa']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout',          [AuthController::class, 'logout']);
            Route::post('logout-all',      [AuthController::class, 'logoutAll']);
            Route::get('me',               [AuthController::class, 'me']);
            Route::put('profile',          [AuthController::class, 'updateProfile']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });
    });

    // ── AUTHENTICATED ROUTES ──────────────────────────────────────
    Route::middleware(['auth:sanctum', 'active.user'])->group(function () {

        // ── Inventory ─────────────────────────────────────────────
        Route::prefix('items')->group(function () {
            Route::get('/',              [ItemController::class, 'index']);
            Route::post('/',             [ItemController::class, 'store']);
            Route::get('/categories',    [ItemController::class, 'categories']);
            Route::get('/{item}',        [ItemController::class, 'show']);
            Route::put('/{item}',        [ItemController::class, 'update']);
            Route::delete('/{item}',     [ItemController::class, 'destroy']);
        });

        // ── Categories, Units, Brands ─────────────────────────────
        Route::apiResource('categories', \App\Http\Controllers\Api\V1\Inventory\CategoryController::class);
        Route::apiResource('units',      \App\Http\Controllers\Api\V1\Inventory\UnitController::class);
        Route::apiResource('brands',     \App\Http\Controllers\Api\V1\Inventory\BrandController::class);

        // ── GRN ───────────────────────────────────────────────────
        Route::prefix('grn')->group(function () {
            Route::get('/',              [GrnController::class, 'index']);
            Route::post('/',             [GrnController::class, 'store']);
            Route::get('/{grn}',         [GrnController::class, 'show']);
            Route::put('/{grn}',         [GrnController::class, 'update']);
            Route::delete('/{grn}',      [GrnController::class, 'destroy']);
            Route::post('/{grn}/approve',[GrnController::class, 'approve']);
            Route::post('/{grn}/reject', [GrnController::class, 'reject']);
        });

        // ── Stock Operations ──────────────────────────────────────
        Route::prefix('stock')->group(function () {
            // Issues
            Route::prefix('issues')->group(function () {
                Route::get('/',               [StockIssueController::class, 'index']);
                Route::post('/',              [StockIssueController::class, 'store']);
                Route::get('/{stockIssue}',   [StockIssueController::class, 'show']);
                Route::put('/{stockIssue}',   [StockIssueController::class, 'update']);
                Route::delete('/{stockIssue}',[StockIssueController::class, 'destroy']);
                Route::patch('/{stockIssue}/approve', [StockIssueController::class, 'approve']);
                Route::patch('/{stockIssue}/reject',  [StockIssueController::class, 'reject']);
            });
            // Returns
            Route::prefix('returns')->group(function () {
                Route::get('/',               [StockReturnController::class, 'index']);
                Route::post('/',              [StockReturnController::class, 'store']);
                Route::get('/{stockReturn}',  [StockReturnController::class, 'show']);
                Route::put('/{stockReturn}',  [StockReturnController::class, 'update']);
                Route::delete('/{stockReturn}',[StockReturnController::class, 'destroy']);
                Route::post('/{stockReturn}/approve', [StockReturnController::class, 'approve']);
            });
            // Transfers
            Route::prefix('transfers')->group(function () {
                Route::get('/',                 [StockTransferController::class, 'index']);
                Route::post('/',                [StockTransferController::class, 'store']);
                Route::get('/{stockTransfer}',  [StockTransferController::class, 'show']);
                Route::put('/{stockTransfer}',  [StockTransferController::class, 'update']);
                Route::delete('/{stockTransfer}',[StockTransferController::class, 'destroy']);
                Route::post('/{stockTransfer}/approve', [StockTransferController::class, 'approve']);
            });
            // Adjustments
            Route::prefix('adjustments')->group(function () {
                Route::get('/',                    [StockAdjustmentController::class, 'index']);
                Route::post('/',                   [StockAdjustmentController::class, 'store']);
                Route::get('/{stockAdjustment}',   [StockAdjustmentController::class, 'show']);
                Route::put('/{stockAdjustment}',   [StockAdjustmentController::class, 'update']);
                Route::delete('/{stockAdjustment}',[StockAdjustmentController::class, 'destroy']);
                Route::post('/{stockAdjustment}/approve', [StockAdjustmentController::class, 'approve']);
            });
            // Stock Taking
            Route::prefix('taking')->group(function () {
                Route::get('/',               [StockTakingController::class, 'index']);
                Route::post('/',              [StockTakingController::class, 'store']);
                Route::get('/{stockTaking}',  [StockTakingController::class, 'show']);
                Route::put('/{stockTaking}',  [StockTakingController::class, 'update']);
                Route::delete('/{stockTaking}',[StockTakingController::class, 'destroy']);
                Route::post('/{stockTaking}/start',    [StockTakingController::class, 'start']);
                Route::post('/{stockTaking}/complete',  [StockTakingController::class, 'complete']);
                Route::post('/{stockTaking}/approve',   [StockTakingController::class, 'approve']);
            });
        });

        // ── Purchase ──────────────────────────────────────────────
        Route::prefix('purchase')->group(function () {
            Route::prefix('requests')->group(function () {
                Route::get('/',                    [PurchaseRequestController::class, 'index']);
                Route::post('/',                   [PurchaseRequestController::class, 'store']);
                Route::get('/{purchaseRequest}',   [PurchaseRequestController::class, 'show']);
                Route::put('/{purchaseRequest}',   [PurchaseRequestController::class, 'update']);
                Route::delete('/{purchaseRequest}',[PurchaseRequestController::class, 'destroy']);
                Route::post('/{purchaseRequest}/submit',  [PurchaseRequestController::class, 'submit']);
                Route::post('/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve']);
                Route::post('/{purchaseRequest}/reject',  [PurchaseRequestController::class, 'reject']);
            });
            Route::prefix('orders')->group(function () {
                Route::get('/',                 [PurchaseOrderController::class, 'index']);
                Route::post('/',                [PurchaseOrderController::class, 'store']);
                Route::get('/{purchaseOrder}',  [PurchaseOrderController::class, 'show']);
                Route::put('/{purchaseOrder}',  [PurchaseOrderController::class, 'update']);
                Route::delete('/{purchaseOrder}',[PurchaseOrderController::class, 'destroy']);
                Route::post('/{purchaseOrder}/send',    [PurchaseOrderController::class, 'send']);
                Route::post('/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
            });
        });

        // ── Reports ───────────────────────────────────────────────
        Route::prefix('reports')->group(function () {
            Route::get('current-stock', [ReportController::class, 'currentStock']);
            Route::get('stock-ledger',  [ReportController::class, 'stockLedger']);
            Route::get('grn',           [ReportController::class, 'grnReport']);
            Route::get('issues',        [ReportController::class, 'issueReport']);
            Route::get('low-stock',     [ReportController::class, 'lowStock']);
            Route::get('zero-stock',    [ReportController::class, 'zeroStock']);
            Route::get('analytics',     [ReportController::class, 'dashboardAnalytics']);
            Route::prefix('export')->group(function () {
                Route::get('current-stock/csv', [ReportController::class, 'exportCurrentStockCsv']);
                Route::get('current-stock/pdf', [ReportController::class, 'exportCurrentStockPdf']);
                Route::get('grn/csv',           [ReportController::class, 'exportGrnCsv']);
                Route::get('issues/csv',        [ReportController::class, 'exportIssuesCsv']);
                Route::get('stock-grn/{grn}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportGrn']);
                Route::get('stock-issue/{issue}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportIssue']);
                Route::get('stock-return/{return}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportReturn']);
                Route::get('stock-transfer/{transfer}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportTransfer']);
                Route::get('stock-adjustment/{adjustment}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportAdjustment']);
                Route::get('customer/{customer}/pdf', [\App\Http\Controllers\Api\V1\Reports\PdfExportController::class, 'exportCustomer']);
            });
        });

        // ── AI ────────────────────────────────────────────────────
        Route::prefix('ai')->group(function () {
            Route::post('chat',                 [AiController::class, 'chat']);
            Route::get('dashboard-summary',     [AiController::class, 'dashboardSummary']);
            Route::get('recommendations',       [AiController::class, 'purchaseRecommendations']);
            Route::post('detect-duplicates',    [AiController::class, 'detectDuplicates']);
            Route::post('classify-item',        [AiController::class, 'classifyItem']);
        });

        // ── Settings ──────────────────────────────────────────────
        Route::put('organization',       [OrganizationController::class, 'update']);
        Route::post('organization/logo/{type}', [OrganizationController::class, 'uploadLogo']);
        Route::apiResource('users',       UserController::class);
        Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::put('users/{user}/roles',           [UserController::class, 'assignRoles']);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('projects',    ProjectController::class);
        Route::apiResource('warehouses',  WarehouseController::class);
        Route::apiResource('suppliers',   SupplierController::class);
        Route::apiResource('assets',      \App\Http\Controllers\AssetController::class);
        Route::apiResource('customers',   \App\Http\Controllers\CustomerController::class);
        Route::apiResource('sub-categories',\App\Http\Controllers\SubCategoryController::class);
        
        Route::get('roles',               [RoleController::class, 'index']);
        Route::put('roles/{role}',        [RoleController::class, 'update']);
        Route::get('roles/permissions',   [RoleController::class, 'permissions']);
        Route::get('audit-logs',          [AuditLogController::class, 'index']);
        Route::get('audit-logs/{id}',     [AuditLogController::class, 'show']);
    });
});
