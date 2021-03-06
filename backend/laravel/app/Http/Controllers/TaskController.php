<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Task;
use App\Sprint;
use App\TaskUser;
use App\ProjectUser;
use App\Repositories\TaskRepository;
use App\Repositories\SprintRepository;
use App\Repositories\UserRepository;
use App\Http\Controllers\ApiController;

class TaskController extends ApiController
{
    private $task;
    private $sprint;
    private $user;

    public function __construct(TaskRepository $task, SprintRepository $sprint, UserRepository $user) 
    {
        // $this->middleware('auth:api');
    	$this->task = $task;
        $this->sprint = $sprint;
        $this->user = $user;
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $tasks = $this->task->find();

        return $this->showAll($tasks);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Sprint $sprint)
    {
        $rules = [
            'sprint_id' => 'required|exists:sprints,id',
            'status_id' => 'required|exists:statuses,id',
            'name' => 'required',
            'total_storypoints' => 'required|integer',
            'remaining_storypoints' => 'digits_between:0,total_storypoints'
        ];

        $this->validate($request, $rules);

        $sprintId = $request->sprint_id;
        $sprint = Sprint::find($sprintId);

        $data = $request->all();
        $data['remaining_storypoints'] = $request->total_storypoints;  

        $sprint->total_storypoints += $request->total_storypoints;
        $sprint->remaining_storypoints += $request->total_storypoints;     

        $task = Task::create($data);
        $sprint->save();

        return $this->showOne($task, 201);
    }

    public function attachUserToTask(Request $request)
    {
        $rules = [
            'email' => 'required|email|exists:users,email'
        ];

        $this->validate($request, $rules);

        $email = $request->email;

        $user = $this->user->findUserByEmail($email);

        if(count($user) === 0) {
            return $this->errorResponse('No user found by that email', 401);
        }

        $userId = $user[0]->id;
        $userExists = TaskUser::where('task_id', '=', $request->task_id)->where('user_id', '=', $userId)->first();

        if(!$userExists) {
        
            $taskUser = new TaskUser;
            $taskUser->task_id = $request->task_id;
            $taskUser->user_id = $user[0]->id;
            $taskUser->save();

            return $this->showAll($user);
        }
        else {
            return $this->errorResponse('User already attached to this task', 409);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Task $task)
    {
        $task = $this->task->findBy($task);

        return $this->showOne($task);
    }

    public function showTaskComments(Task $task)
    {
        $comments = $this->task->findAllComments($task);

        return $this->showAll($comments);
    }

    public function showTaskStatus(Task $task)
    {
        $status = $this->task->findStatus($task);

        return $this->showOne($status);
    }

    public function showTaskUsers(Task $task)
    {
        $users = $this->task->findAllUsers($task);

        return $this->showAll($users);
    }

    public function showTaskNotifications(Task $task)
    {
        $notifications = $this->task->findAllNotifications($task);

        return $this->showAll($notifications);
    }

    public function showTaskBugs(Task $task)
    {
        $bugs = $this->task->findAllBugs($task);

        return $this->showAll($bugs);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Task $task, Sprint $sprint)
    {
        $task = $this->task->findBy($task);
        $reqSpoints = $request->total_storypoints;

        $rules = [
            'sprint_id' => 'exists:sprints,id',
            'status_id' => 'exists:statuses,id',
            'name' => 'required',
            'total_storypoints' => 'required|integer|min:1',
            'remaining_storypoints' => 'min:0|greater_than_or_equal'
        ];

        $this->validate($request, $rules);

        $sprintId = $request->sprint_id;
        $sprint = Sprint::find($sprintId);

        $oldTotStorypoints = $task->total_storypoints;
        $oldRemStorypoints = $task->remaining_storypoints;
        $reqTotStorypoints = $request->total_storypoints;
        $reqRemStorypoints = $request->remaining_storypoints;

        $sprint->id = $request->sprint_id;
        if($request->status_id) {
            $task->status_id = $request->status_id;
        }
        $task->name = $request->name;
        $task->total_storypoints = $reqTotStorypoints;
        if($task->remaining_storypoints) {
            $task->remaining_storypoints = $request->remaining_storypoints;
        }

        if($task->isDirty('total_storypoints')) {  
            if($oldTotStorypoints < $reqTotStorypoints) {
                $reqTotStorypoints -= $oldTotStorypoints;
                $sprint->total_storypoints += $reqTotStorypoints; 
            }
            else {
                $reqTotStorypoints -= $oldTotStorypoints;
                $sprint->total_storypoints += $reqTotStorypoints; 
            } 
        }

        if($task->isDirty('remaining_storypoints')) {
            if($oldRemStorypoints < $reqRemStorypoints) {
                $reqRemStorypoints -= $oldRemStorypoints;
                $sprint->remaining_storypoints += $reqRemStorypoints; 
            }
            else {
                $reqRemStorypoints -= $oldRemStorypoints;
                $sprint->remaining_storypoints += $reqRemStorypoints; 
            }  
        }

        $task->save();

        $sprint->save();

        return $this->showOne($task);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Task $task)
    {
        $task = $this->task->findBy($task);

        $task->notifications()->delete();
        $task->bugs()->delete();
        $task->comments()->delete();
        $task->delete();

        return $this->showOne($task);
    }
}
