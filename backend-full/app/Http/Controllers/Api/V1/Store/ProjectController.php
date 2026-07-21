<?php
namespace App\Http\Controllers\Api\V1\Store;
use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ProjectController extends Controller {
    public function index(Request $request): JsonResponse {
        $projects = Project::with("department")->when($request->search, fn($q)=>$q->where("name_en","like","%{$request->search}%"))->paginate($request->per_page??20);
        return response()->json(["data"=>$projects]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("manage-projects");
        $v = $request->validate(["name_en"=>"required|string","name_si"=>"nullable|string","department_id"=>"nullable|exists:departments,id","start_date"=>"nullable|date","end_date"=>"nullable|date","budget"=>"nullable|numeric","status"=>"nullable|in:planning,active,on_hold,completed,cancelled"]);
        $v["project_code"] = "PRJ-".str_pad(Project::count()+1,5,"0",STR_PAD_LEFT);
        $project = Project::create($v);
        return response()->json(["message"=>"Project created.","data"=>$project],201);
    }
    public function show(Project $project): JsonResponse { return response()->json(["data"=>$project->load("department")]); }
    public function update(Request $request, Project $project): JsonResponse {
        $this->authorize("manage-projects");
        $project->update($request->validate(["name_en"=>"sometimes|string","status"=>"sometimes|in:planning,active,on_hold,completed,cancelled","end_date"=>"nullable|date","budget"=>"nullable|numeric"]));
        return response()->json(["message"=>"Project updated.","data"=>$project->fresh()]);
    }
    public function destroy(Project $project): JsonResponse { $this->authorize("manage-projects"); $project->delete(); return response()->json(["message"=>"Project deleted."]); }
}