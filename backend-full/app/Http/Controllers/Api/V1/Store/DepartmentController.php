<?php
namespace App\Http\Controllers\Api\V1\Store;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class DepartmentController extends Controller {
    public function index(Request $request): JsonResponse {
        $depts = Department::with("headOfficer")->when($request->search, fn($q)=>$q->where("name_en","like","%{$request->search}%"))->orderBy("name_en")->get();
        return response()->json(["data"=>$depts]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("manage-departments");
        $dept = Department::create($request->validate(["code"=>"required|string|unique:departments","name_en"=>"required|string","name_si"=>"nullable|string","description"=>"nullable|string","head_officer_id"=>"nullable|exists:users,id"]));
        AuditLog::record("department_created","Department created: {$dept->name_en}",$dept);
        return response()->json(["message"=>"Department created.","data"=>$dept],201);
    }
    public function show(Department $department): JsonResponse { return response()->json(["data"=>$department->load("headOfficer")]); }
    public function update(Request $request, Department $department): JsonResponse {
        $this->authorize("manage-departments");
        $department->update($request->validate(["name_en"=>"sometimes|string","name_si"=>"nullable|string","is_active"=>"sometimes|boolean","head_officer_id"=>"nullable|exists:users,id"]));
        return response()->json(["message"=>"Department updated.","data"=>$department->fresh()]);
    }
    public function destroy(Department $department): JsonResponse { $this->authorize("manage-departments"); $department->delete(); return response()->json(["message"=>"Department deleted."]); }
}