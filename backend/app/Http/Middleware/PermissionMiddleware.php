<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class PermissionMiddleware {
    public function handle(Request $request, Closure $next, string ...$permissions): Response {
        $user = $request->user();
        if (!$user) return response()->json(["message"=>"Unauthenticated."],401);
        if ($user->hasRole("super-admin")) return $next($request);
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) return $next($request);
        }
        return response()->json(["message"=>"You do not have permission to perform this action."],403);
    }
}