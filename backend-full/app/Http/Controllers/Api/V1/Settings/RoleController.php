<?php
namespace App\Http\Controllers\Api\V1\Settings;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
class RoleController extends Controller {
    public function index(): JsonResponse { $this->authorize("manage-roles"); return response()->json(["data"=>Role::with("permissions")->get()]); }
    public function show(Role $role): JsonResponse { $this->authorize("manage-roles"); return response()->json(["data"=>$role->load("permissions")]); }
    public function update(Request $request, Role $role): JsonResponse {
        $this->authorize("manage-roles");
        if ($role->name === "super-admin") return response()->json(["message"=>"Cannot modify Super Admin role."],403);
        $request->validate(["permissions"=>"required|array","permissions.*"=>"string|exists:permissions,name"]);
        $role->syncPermissions($request->permissions);
        AuditLog::record("role_updated","Permissions updated for role: {$role->name}",$role);
        return response()->json(["message"=>"Role permissions updated.","data"=>$role->fresh()->load("permissions")]);
    }
    public function store(Request $request): JsonResponse { return response()->json(["message"=>"Not implemented"],501); }
    public function destroy(Role $role): JsonResponse { return response()->json(["message"=>"Not implemented"],501); }
    public function permissions(): JsonResponse { $this->authorize("manage-roles"); return response()->json(["data"=>Permission::all()->groupBy(fn($p)=>explode("-",$p->name)[0])]); }
}