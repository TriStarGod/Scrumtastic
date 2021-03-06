import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Dropdown, Button, NavItem, Tabs, Tab, Row, Input, Modal, Icon } from 'react-materialize';
import logo from '../images/scrumtastic_logo_white.png';
import axios from 'axios';
import { BASE_URL } from '../constants';
import moment from 'moment';
import Toast from './Toast';
import '../App.css';
import ReactConfirmAlert, { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

class SprintView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            'userId': '',
            'email': '',
            'userEmail': '',
            'token': '',
            'projectId': '',
            'users': [],
            'sprints': [],
            'features': [],
            'stories': [],
            'backlogStories': [],
            'sprintStartDate': '',
            'sprintEndDate': '',
            'storyDesc': '',
            'newStoryDesc': '',
            'clickedStory': '',
            'storyEditingMode': false,
            'userStoryCheck': false,
            'selectValue': '',
            'sprintId': '',
            'error': [],
            'origStories': []
        }
    }

    componentWillMount() {
       let email = localStorage.getItem('email');
       let token = localStorage.getItem('token');
       let userId = localStorage.getItem('userId');
       let projectId = localStorage.getItem('projectId');
       let projectName = localStorage.getItem('projectName');
       let stories = localStorage.getItem('stories');
       let origStories = localStorage.getItem('backlogStories');
       this.setState({'token': token, 'userId': userId, 'projectId': projectId, 'projectName': projectName, 'email': email, 'backlogStories': stories, 'origStories': origStories});

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
        axios.get(`${BASE_URL}/projects/${projectId}/users`)
            .then((data) => {
                this.setState({'users': data.data[0].users})
            })
            .catch((error) => {
                this.setState({error});
                this.loadStories()
            })  
    }

    componentDidMount() {
        const token = 'Bearer ' + this.state.token
        const projectId = this.state.projectId;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.get(`${BASE_URL}/projects/${projectId}/sprints`)
            .then((data) => {
                let projectSprints = [];
                data.data[0].sprints.forEach((sprint) => {
                    projectSprints.push(sprint);
                })
                this.setState({'sprints': projectSprints});
                this.getStories(projectSprints);
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    loadStories() {
        const token = 'Bearer ' + this.state.token
        const projectId = this.state.projectId;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.get(`${BASE_URL}/projects/${projectId}/stories`)
            .then((data) => {
                let projectStories = [];
                data.data[0].stories.forEach((story) => {
                    projectStories.push(story);
                })
                this.setState({'stories': projectStories});
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    saveStoriesToStorage() {
        localStorage.setItem('stories', this.state.stories);
        localStorage.setItem('sprintId', this.state.sprintId);
    }

    confirmStory(storyId) {
        confirmAlert({                   
            message: 'Are you sure you want to delete this story?',              
            confirmLabel: 'Delete',                        
            cancelLabel: 'Cancel',                           
            onConfirm: () => this.deleteStory(storyId)
          })
    }

    confirmUser(userId) {
        confirmAlert({                   
            message: 'Are you sure you want to delete this user from the project?',              
            confirmLabel: 'Delete',                        
            cancelLabel: 'Cancel',                           
            onConfirm: () => this.deleteUser(userId)
          })
    }

    deleteUser(userId) {
        let users = this.state.users;
        let projectId = this.state.projectId;
        const token = 'Bearer ' + this.state.token;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.delete(`${BASE_URL}/deleteprojectuser`, {
            params : {
                "user_id": userId,
                "project_id": projectId
            }
        })
            .then((data) => {
                this.searchAndDeleteUserFromState(userId, users);
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    renderUsers() {

        return (
            <ul className="collection">
            {
            this.state.users.map(user => {
                console.log('some user',user)
                    return (
                        <li key={user.id} className="collection-item">{user.email}{(user.admin === "true") ? <div style={{float: 'left', position: 'relative', top: '-5px'}}><i className="material-icons">supervisor_account</i></div> : <div style={{float: 'left', position: 'relative', top: '-5px'}}><Icon>account_box</Icon></div>}
                            <a onClick={this.confirmUser.bind(this, user.id)} style={{cursor: 'pointer'}}><i className="material-icons small" style={{color: '#a6262c', float: 'right'}}>delete_forever</i></a>
                        </li>
                    )  
            })
            }
            </ul>
        )
    }

    getStories(projectSprints) {
        const token = 'Bearer ' + this.state.token;
        let stateStories = [];

        projectSprints.forEach(sprint => {
            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            axios.defaults.headers.common['Authorization'] = token
            axios.get(BASE_URL + '/sprints/' + sprint.id + '/stories')
                .then((data) => {

                    let sprintStories = [];
                    data.data[0].stories.forEach((story) => {
                        sprintStories.push(story);
                    })
                    sprintStories.forEach(story => {
                        stateStories.push(story);
                    })
                    this.setState({'stories': stateStories});

                        this.getBacklogStories();
                })
                .catch((error) => {
                    this.setState({error});
                }) 
        })
    }

    getBacklogStories() {
        const token = 'Bearer ' + this.state.token
        const projectId = this.state.projectId;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token

        axios.get(`${BASE_URL}/projects/${projectId}/stories`)
            .then((data) => {
                let projectStories = [];
                data.data[0].stories.forEach((story) => {
                    projectStories.push(story);
                })
                console.log('projectstories', projectStories)
                this.setState({'backlogStories': projectStories});
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    logOut() {
        const token = 'Bearer ' + this.state.token;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.post(`${BASE_URL}/logout`, {
            'email': this.state.email,
        })
            .then((data) => {
                if(data.status === 200) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('email')
                    let t = new Toast("Succesfully logged out!", 2500)
                    t.Render(); 
                    setTimeout(() => {browserHistory.push('/signin')}, 2500)
                }
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    addSprint() {
        const token = 'Bearer ' + this.state.token;
        let sprints = this.state.sprints;
        let startDate = moment(this.state.sprintStartDate).format();
        let endDate = moment(this.state.sprintEndDate).format();

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.post(`${BASE_URL}/sprints`, {
            'project_id': this.state.projectId,
            'start_date': startDate,
            'end_date': endDate
        })
            .then((data) => {
                sprints.push(data.data)
                this.setState({sprints: sprints});
                let sprintModal = document.getElementById('sprintModal');
                let sprintModalOverlay = document.getElementById('materialize-modal-overlay-1');
                sprintModal.style.display = 'none';
                sprintModalOverlay.style.display = 'none';
                let t = new Toast("New sprint added to project!", 2500)
                t.Render(); 
            })
            .catch((error) => {
                this.setState({error});
            })         
    }

    createStory(sprintId) {
        let stories = this.state.stories;

        const token = 'Bearer ' + this.state.token;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.post(`${BASE_URL}/sprintstories`, {
            'description': this.state.storyDesc,
            'sprint_id': sprintId,
            'project_id': this.state.projectId
        })
            .then((data) => {
                data.data.pivot = { 'sprint_id': sprintId, 'story_id': data.data.id};
                stories.push(data.data);
                this.setState({'stories': stories});
                document.getElementById('story').value = "";
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    handleCheck() {
        this.setState({'userStoryCheck': !this.state.userStoryCheck});
    }

    createStorySelect(sprintId) {
        const backlogStories = this.state.backlogStories;
        if (backlogStories) {
            let items = [];
            for(let i = 0; i < backlogStories.length; i++) {
                items.push(<NavItem key={i} value={backlogStories[i].description} onClick={this.handleChange.bind(this, backlogStories[i].id, sprintId)}>{backlogStories[i].description}</NavItem>);
            }

            return items;
        }
    }
    
    addStoryToSprint(storyId, sprintId) {
        const token = 'Bearer ' + this.state.token;
        let stories = this.state.stories;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.post(`${BASE_URL}/storestorypivot`, {
            'sprint_id': sprintId,
            'story_id': storyId
        })
            .then((data) => {
                data.data.pivot = { 'sprint_id': sprintId, 'story_id': data.data.id};
                stories.push(data.data);
                this.setState({'stories': stories});
                this.forceUpdate();
            })
            .catch((error) => {
                this.setState({error});
            })        
    }

    renderErrors() {
        let errors = [];
        if(this.state.error.response && this.state.error.response.data) {
            const errorResp = this.state.error.response.data.error;
            if (typeof errorResp === "string") {
                errors.push(<p className="errorMessage" key={"error_" + 1}>{errorResp}</p>)
            } else {
                for (let key in errorResp) {
                    errors.push(<p className="errorMessage" key={"error_" + key}>{errorResp[key]}</p>)
                }
            }
        }
        return <div className="center-align-error">{errors}</div>
    }

    handleChange(storyId, sprintId) {
        this.addStoryToSprint(storyId, sprintId);
    }

    goToTasks(sprintId) {
        localStorage.setItem('sprintId', sprintId);
        browserHistory.push('/board');
    }

    addUser() {
        const token = 'Bearer ' + this.state.token;
        let users = this.state.users;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.post(`${BASE_URL}/attachuser`, {
            'email': this.state.userEmail,
            'project_id': this.state.projectId
        })
            .then((data) => {
                users.push(data.data[0]);
                this.setState({users: users})
                let userModal = document.getElementById('userModal');
                let userModalOverlay = document.getElementById('materialize-modal-overlay-1');
                userModal.style.display = 'none';
                userModalOverlay.style.display = 'none';
                let t = new Toast(this.state.userEmail + " added to project!", 2500)
                t.Render(); 
            })
            .catch((error) => {
                this.setState({error});
            })   
    }

    sprintIdToStorage(sprintId) {
        this.setState({sprintId: sprintId})
        console.log(sprintId)
    }

    editStory(storyId, storyDescription) {

        if(this.state.storyEditingMode === true) {
            const token = 'Bearer ' + this.state.token;
            let newStoryDesc = this.state.newStoryDesc;
            let stories = this.state.stories;

            if(this.state.storyDesc) {
                newStoryDesc = this.state.storyDesc
            }

            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            axios.defaults.headers.common['Authorization'] = token
            axios.put(`${BASE_URL}/stories/${storyId}`, {
                'description': newStoryDesc
            })
                .then((data) => {
                    for (var i=0; i < stories.length; i++) {
                        if (stories[i].id === storyId) {
                            stories[i].description = newStoryDesc;
                            this.setState({'stories': stories, 'storyDesc': ''});
                            let t = new Toast("Succesfully edited story!", 2500)
                            t.Render(); 
                        }
                    }  
                })
                .catch((error) => {
                    this.setState({error});
                }) 
        } 
        else {
            this.setState({'newStoryDesc': storyDescription});
        }

        if(storyId) {
            this.setState({'clickedStory': storyId});
        }
        this.setState({'storyEditingMode': !this.state.storyEditingMode});
    }

    deleteStory(storyId) {
        let stories = this.state.stories;
        const token = 'Bearer ' + this.state.token;

        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.headers.common['Authorization'] = token
        axios.delete(`${BASE_URL}/stories/${storyId}`)
            .then((data) => {
                this.searchAndDeleteStoryFromState(storyId, stories);
            })
            .catch((error) => {
                this.setState({error});
            }) 
    }

    searchAndDeleteUserFromState(keyName, array) {
        for (var i=0; i < array.length; i++) {
            if (array[i].id === keyName) {
                delete array[i]
                this.setState({'users': array});
                let t = new Toast("Succesfully deleted user!", 2500)
                t.Render(); 
            }
        }    
    }

    searchAndDeleteStoryFromState(keyName, array) {
        for (var i=0; i < array.length; i++) {
            if (array[i].id === keyName) {
                delete array[i]
                this.setState({'stories': array});
                let t = new Toast("Succesfully deleted story!", 2500)
                t.Render(); 
            }
        }    
    }

    renderSprints() {
        const sprints = this.state.sprints;
        const stories = this.state.stories;

        return (
            <div className="row">
                {this.state.sprints.length === 0 ? <p style={{marginLeft: '10px'}} className="sprint-message waves-effect waves-light teal lighten-2">Seems like you need to add some sprints</p> : null }
                <Tabs className='tab-demo z-depth-1'>
                {
                    sprints.map(sprint => {
                        return (
                            <Tab key={sprint.id} title={<a onClick={this.sprintIdToStorage.bind(this, sprint.id)}>{sprint.name}</a>}>

                                <h3>{moment(sprint.start_date).format("MMM Do YY")} - {moment(sprint.end_date).format("MMM Do YY")}</h3>
                                {
                                    stories.map((story, key) => {
                                        if(story.pivot.sprint_id === sprint.id) {
                                            return (
                                                <ul key={key} className="collection with-header">
                                                {
                                                    <li key={key+1} className="collection-item">
                                                    {
                                                        (!this.state.storyEditingMode && (this.state.clickedStory === null)) || (!this.state.storyEditingMode && (this.state.clickedStory === story.id)) || (!this.state.storyEditingMode && (this.state.clickedStory !== story.id)) || (this.state.storyEditingMode && (this.state.clickedStory !== story.id)) ?
                                                        <div>
                                                            <div style={{float: 'left', position: 'relative', top: '-5px'}}><Icon small>label_outline</Icon></div> {story.description}
                                                            <a onClick={this.confirmStory.bind(this, story.id)} style={{cursor: 'pointer'}}><i className="material-icons small" style={{color: '#a6262c', float: 'right'}}>delete_forever</i></a>
                                                            <a onClick={this.editStory.bind(this, story.id, story.description)} style={{cursor: 'pointer'}}><i className="material-icons small" style={{color: '#2633a6', float: 'right'}}>mode_edit</i></a>
                                                        </div>
                                                        :
                                                        <div className="row">
                                                            <div className="input-field col s8">
                                                                <input 
                                                                    type="text"
                                                                    placeholder={story.description}
                                                                    onChange={event => this.setState({storyDesc:event.target.value})}
                                                                    onKeyPress={event => {
                                                                    if(event.key === "Enter") {
                                                                            this.editStory(story.id, null);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <a onClick={() => {this.editStory(story.id, null)}} style={{cursor: 'pointer'}}><i className="material-icons small" style={{color: '#2633a6', float: 'right'}}>mode_edit</i></a>
                                                        </div>
                                                    }
                                                    </li>
                                                }
                                                </ul>
                                            )
                                        }
                                    
                                    })
                                }

                                { !this.state.userStoryCheck ?
                                    <div>
                                    <input 
                                        className="validate"
                                        type="text"
                                        id="story"
                                        placeholder="Add Your User Story"
                                        onChange={event => this.setState({storyDesc:event.target.value})}
                                        onKeyPress={event => {
                                        if(event.key === "Enter") {
                                                this.createStory(sprint.id);
                                            }
                                        }}
                                    />
                                    <p>
                                        <input type="checkbox" className="filled-in" id={sprint.id} onClick={this.handleCheck.bind(this)} />
                                            <label htmlFor={sprint.id}>Check to select a User Story</label>
                                    </p>
                                </div>
                                :
                                <div>
                                    <Dropdown trigger={
                                        <Button defaultValue={this.state.selectValue} onChange={this.handleChange}>Select User Story</Button>
                                        }>
                                        {this.createStorySelect(sprint.id)}
                                    </Dropdown>
                                    <p>
                                    <input type="checkbox" className="filled-in" id={sprint.id} onClick={this.handleCheck.bind(this)} />
                                        <label htmlFor={sprint.id}>Check to manually add a User Story</label>
                                    </p>
                                </div>
                                }
                                <a 
                                    className="waves-effect waves-light btn-large"
                                    onClick={() => this.goToTasks(sprint.id)}
                                >
                                Sprint Board
                                </a>
                            </Tab>
                        )
                    })
                }
                </Tabs>
            </div>
        )
    }

    render() {
        return (
            <div>
                <nav className="teal lighten-3">
                    <div className="nav-wrapper">
                    <a className="brand-logo" href="/"><img className="nav-logo" src={logo} alt="logo"/></a>
                        <ul id="nav-mobile" className="left hide-on-med-and-down" style={{paddingLeft: '180px'}}>
                            <li><a href="/">Projects</a></li>
                            <li><a href="/projects">Backlog</a></li>
                            <li><a onClick={this.saveStoriesToStorage.bind(this)} href="/list">Board</a></li>
                        </ul>
                        <ul id="nav-mobile" className="right hide-on-med-and-down" style={{marginRight: '10px'}}>
                            <i className="material-icons" style={{height: 'inherit', lineHeight: 'inherit', float: 'left', margin: '0 30px 0 0', width: '2px'}}>perm_identity</i>
                            <Dropdown trigger={
                                <Button style={{display: 'inline'}}>{this.state.email}</Button>
                                }>
                                <NavItem onClick={this.logOut.bind(this)}><i className="material-icons">input</i>Log Out</NavItem>
                                <NavItem divider />
                            </Dropdown>
                        </ul>
                    </div>
                </nav>
                <div className="row">
                    <div className="col s2" />
                    <div className="col s8">
                        <h2 style={{color: '#26a69a'}}>{this.state.projectName}: Sprints</h2>
                        <Modal id="sprintModal" trigger={<Button style={{float: 'right', position: 'relative', top: '-70px'}}><Icon small>
                                playlist_add
                            </Icon><span style={{position: 'relative', top: '-4px', marginLeft: '5px'}}>Add Sprint</span></Button>}>
                        <div className="row">
                            <div className="col s2" />
                            <div className="col s7">
                                <h2 style={{paddingLeft: '77px', color: '#26a69a'}}>Add Sprint</h2>
                            </div>
                            <div className="col s3" />
                        </div>
                        <div className="row">
                            <div className="col s3" />
                            <div className="col s6">
                            <Row>
                                <i className="material-icons" style={{position: 'relative', top: '30px', float: 'left'}}>date_range</i>
                                <Input style={{width: '175px'}} name='on' type='date' placeholder="Start Date" onChange={event => this.setState({sprintStartDate:event.target.value})} />
                                <i className="material-icons" style={{position: 'relative', top: '30px', float: 'left'}}>date_range</i>
                                <Input style={{width: '175px'}} name='on' type='date' placeholder="End Date" onChange={event => this.setState({sprintEndDate:event.target.value})} />
                                <Button
                                    onClick={() => this.addSprint()}
                                >
                                    Add Sprint
                                </Button>
                            </Row>
                            </div>
                            <div className="col s3" />
                        </div>
                        <div className="row">
                            <div className="col s3" />
                            <div className="col s6">
                                {this.renderErrors()}
                            </div>
                            <div className="col s3" />
                        </div>
                        </Modal>
                        <Modal id="userModal" trigger={<Button style={{float: 'right', position: 'relative', top: '-70px', marginRight: '15px'}}>
                            <Icon small>
                                account_box
                            </Icon><span style={{position: 'relative', top: '-4px', marginLeft: '5px'}}>Add User</span></Button>}>
                        <div className="row">
                            <div className="col s2" />
                            <div className="col s7">
                                <h2 style={{paddingLeft: '25px', color: '#26a69a'}}>Add User</h2>
                            </div>
                            <div className="col s3" />
                        </div>
                        <div className="row">
                            <div className="col s2" />
                            <div className="col s1" style={{paddingTop: '25px', paddingLeft: '40px'}}>
                                <Icon small>
                                email    
                                </Icon>
                            </div>
                            <div className="input-field inline col s6">
                                <input 
                                    className="validate"
                                    id="user"
                                    type="email"
                                    defaultValue=""
                                    onChange={event => this.setState({userEmail:event.target.value})}
                                    onKeyPress={event => {
                                    if(event.key === "Enter") {
                                            this.addUser();
                                        }
                                    }}
                                />
                                <label htmlFor="user">Enter User Email</label>
                            </div>
                            <div className="col s3" />
                        </div>
                        <div className="row">
                            <div className="col s3" />
                            <div className="col s6">
                                {this.renderErrors()}
                            </div>
                            <div className="col s3" />
                        </div>
                        </Modal>
                        {this.renderSprints()}
                        <div className="row">
                            { this.renderErrors() }
                        </div>
                        <h2 style={{color: '#26a69a'}}>Contributors</h2>
                        <div className="row">
                            {this.renderUsers()}
                        </div>
                    </div>
                    <div className="col s2" />
                </div>
                <Modal
                header={<h2 style={{color: '#26a69a'}}>Sprint View</h2>}
                bottomSheet
                trigger={<div className="row"><div className="col s12"><a style={{position: 'absolute', right: '50px', bottom: '30px'}} className="btn btn-floating btn-large"><i className="material-icons">help_outline</i></a></div></div>}
                >
                    <h4>What can I do here?</h4>
                    <ol>
                        <li>Check user stories/sprints</li>
                        <li>Create user stories/sprints</li>
                        <li>Edit user stories</li>
                        <li>Delete user stories</li>
                        <li>Manage contributors of sprints</li>
                    </ol>
                </Modal>
            </div>
        )
    }
}

export default SprintView;