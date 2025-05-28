const body = document.querySelector("body")
const container = document.getElementById("container")
const userInputTaskContent = document.getElementById("userInputTaskContent")
const userInputTaskDeadline = document.getElementById("userInputTaskDeadline")
const taskContainer = document.getElementById("taskContainer")
const filter = document.getElementById("filter")
const addGropBtnClassName = "addTaskToGroup"
const soundSrc = document.getElementById("audioSrc")
const playSoundEffect = new CustomEvent("playSoundEffect")
const deadlineStatusClassCollection = ["finishedOnTime", "unfinishedOnTime", "deadlineAlertBackGroundChange"]
const progressionStatusBar = document.getElementById("progressionStatusBar")
const progression = document.getElementById("progression")
let addTaskToGroupBtnDisplay = "none"
let quoteUrlApi = "./dataBase/quote.json"

const filterDefaultValues = ["all", "done", "undone"]

const taskList = getLocalStorage("taskList")
let filteredTask = taskList
let filterCollection = getLocalStorage("filter")

for (let i = 0; i < taskList.length; i++) {
    if (taskList[i] === null) {
        taskList.splice(i, 1)
    }
}
setLocalStorage("taskList", taskList)

function establishTask() {
    setLocalStorage("taskList", taskList)
    const myFilter = document.getElementById("filter").value;
    if (myFilter === filterDefaultValues[0]) {
        filteredTask = taskList
    }
    else if (myFilter === filterDefaultValues[1]) {
        filteredTask = taskList.filter(x => x.checked === true)
    }
    else if (myFilter === filterDefaultValues[2]) {
        filteredTask = taskList.filter(x => x.checked === false)
    }
    else {
        filteredTask = taskList.filter(x => x.group.includes(myFilter))
    }
    checkDeadline()
}

function lightRefresh() {
    establishTask()
    refreshTask()
}

function hardRefresh() {
    establishTask()
    reloadTask()
    refreshTask()
}

function refreshTask() {
    let TaskIdCollection = filteredTask.map(task => task.id)
    const _taskDOMCollection = Array.from(taskContainer.children)
    for (let i = 0; i < taskList.length; i++) {
        let _taskDOM = _taskDOMCollection[i]
        if (TaskIdCollection.includes(_taskDOM.id)) {
            if (filterDefaultValues.includes(filter.value)) {
                _taskDOM.querySelector(".removeTaskFromGroupBtn").style.display = "none"
            }
            else {
                _taskDOM.querySelector(".removeTaskFromGroupBtn").style = ""
            }
            _taskDOM.style = ""
        }
        else {
            _taskDOM.style.display = "none"
        }
    }
}

function reloadTask() {
    const _tasks = taskContainer.children;
    while (_tasks.length) {
        taskContainer.removeChild(_tasks[0])
    }
    displayTask();
}



function displayFilter() {
    while (filter.length > 3) {
        filter.removeChild(filter[filter.length - 1])
    }
    for (let accessory of filterCollection) {
        const option = document.createElement("option")
        option.textContent = accessory
        filter.appendChild(option)
    }
}

hardRefresh()
displayFilter()

function displayTask() {
    for (let task of taskList) {
        let newTask = document.createElement("li")
        let delBtn = document.createElement("i")
        let editBtn = document.createElement("i")
        let checkTask = document.createElement("input")
        let content = document.createElement("textarea")
        let addTaskToGroup = document.createElement("i")
        let removeTaskFromGroupBtn = document.createElement("i")
        let deadline = document.createElement("input")
        let deadlineStatus = document.createElement("span")
        let cancelDeadlineBtn = document.createElement("i")
        let dragBtn = document.createElement("i")

        newTask.addEventListener("dragstart", dragTaskStart)
        newTask.addEventListener("dragover", dragTaskOver)
        newTask.addEventListener("drop", dropTask)

        checkTask.checked = task.checked
        checkTask.id = task.id + "check"
        newTask.id = task.id
        content.value = task.taskContent
        content.className = "taskContentDOM"
        content.readOnly = true
        checkTask.type = "checkbox"
        checkTask.className = "checkBox"
        deadline.type = "datetime-local"
        deadline.id = "deadline"
        deadline.value = task.deadline
        deadlineStatus.id = "deadlineStatus"
        deadlineStatus.textContent = "unset"
        delBtn.className = 'fa-solid fa-trash btn'
        editBtn.className = 'fa-solid fa-pen btn'
        addTaskToGroup.className = "fa-solid fa-plus btn addTaskToGroupBtn"
        addTaskToGroup.style.display = addTaskToGroupBtnDisplay
        cancelDeadlineBtn.className = 'fa-regular fa-calendar-xmark btn'
        removeTaskFromGroupBtn.className = "fa-solid fa-minus removeTaskFromGroupBtn btn"
        dragBtn.className = "fa-solid fa-grip-lines btn dragBtn"
        if (filterDefaultValues.includes(filter.value)) {
            removeTaskFromGroupBtn.style.display = "none"
        }
        newTask.className = "task"
        editBtn.value = "edit"
        if (checkTask.checked) {
            newTask.classList.add("checked")
        } else if (checkTask.checked) {
            newTask.classList.remove("checked")
        }
        content.addEventListener("click", showFullContent)
        delBtn.addEventListener("click", deleteTask)
        checkTask.addEventListener("click", checkBox)
        editBtn.addEventListener("click", editTask)
        addTaskToGroup.addEventListener("click", chooseTaskToAdd)
        removeTaskFromGroupBtn.addEventListener("click", removeTaskGroup)
        deadline.addEventListener("change", getDeadline)
        deadline.addEventListener("change", checkDeadline)
        cancelDeadlineBtn.addEventListener("click", removeDeadline)

        // drag and drop 
        // newTask.setAttribute("draggable", "false")
        dragBtn.addEventListener("mousedown", () => { dragElement(newTask) })
        dragBtn.addEventListener("mouseup", () => {
            dragBtn.removeEventListener("mousedown", dragElement(newTask))
        })

        newTask.appendChild(dragBtn)
        newTask.appendChild(checkTask)
        newTask.appendChild(content)
        newTask.appendChild(deadline)
        newTask.appendChild(deadlineStatus)
        newTask.appendChild(cancelDeadlineBtn)
        newTask.appendChild(editBtn)
        newTask.appendChild(delBtn)
        newTask.appendChild(removeTaskFromGroupBtn)
        newTask.appendChild(addTaskToGroup)
        taskContainer.appendChild(newTask)
    }

}

function showFullContent(e) {
    e.target.classList.toggle("showFullContent")
}

// drag and drop

function dragElement(element) {
    element.draggable = "true"
}

function dragTaskStart(e) {
    e.dataTransfer.setData("id", e.target.id)
}

function dragTaskOver(e) {
    e.preventDefault()
}

function dropTask(e) {
    e.preventDefault()
    const taskStartId = e.dataTransfer.getData("id")
    let targetId
    if (!taskStartId.includes("N")) {
        return
    }
    if (e.target.className === "task") {
        targetId = e.target.id
    }
    else if (["taskContentDOM", "checkBox", "fa-solid fa-grip-lines btn dragBtn"].includes(e.target.className)) {
        targetId = e.target.parentNode.id
    }
    else {
        return
    }
    const droppedTaskIndex = taskList.findIndex(task => task.id === targetId)
    const draggedTaskIndex = taskList.findIndex(task => task.id === taskStartId)
    let draggedTaskData = taskList[draggedTaskIndex]
    // problem the list doen't change if reversing the direction of dropped item
    // document.getElementById(taskStartId).innerHTML
    taskList.splice(draggedTaskIndex, 1)
    taskList.splice(droppedTaskIndex, 0, draggedTaskData)
    document.dispatchEvent(playSoundEffect)
    hardRefresh()
}

//

function getRdmInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

function getIds() {
    const _ids = [];
    for (let _task of taskList) {
        _ids.push(_task.id)
    }
    return _ids;
}

function randomIDs(arr) {
    let randomId = "N" + Math.floor(Math.random() * (Math.floor(arr.length / 10) + 1) * 10).toString()
    while (arr.includes(randomId)) {
        randomId = "N" + Math.floor(Math.random() * (Math.floor(arr.length / 10) + 1) * 10).toString()
    }
    return randomId;
}

function addTask() {
    if (userInputTaskContent.value === "") {
        alert("You can not leave it empty")
        return 0;
    }
    let Ids = getIds();
    let randomId = randomIDs(Ids);
    const _taskContent = {
        taskContent: userInputTaskContent.value,
        checked: false,
        id: randomId,
        group: [],
        deadline: userInputTaskDeadline.value,
    }
    taskList.unshift(_taskContent)
    // Dispatch a custom "taskAdded" event
    filteredTask = taskList;
    hardRefresh()
    userInputTaskContent.value = ""
    userInputTaskDeadline.value = ""
    document.dispatchEvent(playSoundEffect)
}

function deleteTask(event) {
    const _delBtn = event.target
    const _task = _delBtn.parentNode;
    let taskIndex = taskList.findIndex(value => value.id === _task.id)
    taskList.splice(taskIndex, 1)
    _task.style.display = "none"
    setLocalStorage("taskList", taskList)
    document.dispatchEvent(playSoundEffect)
    updateProgression()
}

function checkBox(event) {
    const check = event.target
    const _task = check.parentNode
    let taskIndex = taskList.findIndex(value => value.id === _task.id)
    taskList[taskIndex].checked = check.checked
    if ((filter.value === "undone" && check.checked) || (filter.value === "done" && !check.checked)) {
        _task.style.display = "none"
    }
    else {
        _task.style = ""
    }
    _task.classList.toggle("checked")
    setLocalStorage("taskList", taskList)
    updateProgression()
    document.dispatchEvent(playSoundEffect)
}

// getting null as the readonly property removed when set to false
function editTask(event) {
    const _editBtn = event.target;
    const _task = _editBtn.parentNode
    const _taskContentDOM = _task.querySelector("textArea")
    const taskIndex = taskList.findIndex(value => value.id === _task.id)
    if (_editBtn.value === "edit") {
        _editBtn.value = "onedit"
        _editBtn.className = 'fa-solid fa-check btn'
        _taskContentDOM.focus()
        _taskContentDOM.style = ""
        _taskContentDOM.readOnly = false
    }
    else if (_editBtn.value === "onedit") {
        _editBtn.value = "edit"
        _editBtn.className = 'fa-solid fa-pen btn'
        if (confirm("Are you sure to edit this task ?")) {
            taskList[taskIndex].taskContent = _taskContentDOM.value
            setLocalStorage("taskList", taskList)
        }
        else {
            _taskContentDOM.value = taskList[taskIndex].taskContent
        }
        _taskContentDOM.readOnly = true
        _taskContentDOM.blur()
    }
}

function addNewGroup() {
    const addGroup = document.getElementById("addGroup")
    const addGroupInput = document.getElementById("addGroupInput")

    if (addGroupInput.value === "") {
        alert("You mustn't leave it empty!")
        hardRefresh()
        return
    }
    else if (addGroup.value === "add-group") {
        addGroupInput.style.display = "inline"
        addGroupInput.readOnly = true;
        addGroup.textContent = "Apply"
        addGroup.value = "submit-group"
        addTaskToGroupBtnDisplay = "inline"
        // addGroupBtnClass += "active"
        hardRefresh()
    }
    else if (addGroup.value === "submit-group") {
        const taskGroup = document.createElement("option")
        let _filterCollection = new Set(filterCollection)
        taskGroup.textContent = addGroupInput.value.trim();
        _filterCollection.add(taskGroup.textContent)
        filterCollection = Array.from(_filterCollection)
        setLocalStorage("filter", filterCollection)
        addTaskToGroupBtnDisplay = "none"
        // addGroupBtnClass = addGropBtnClassName
        addGroup.value = "add-group"
        addGroup.textContent = "Add Group"
        addGroupInput.value = ""
        addGroupInput.readOnly = false
        displayFilter()
        hardRefresh()
    }
}

function removeGroup() {
    const filter = document.getElementById("filter")
    const options = filter.querySelectorAll("option")
    for (let option of options) {
        if (!["all", "done", "undone"].includes(option.value) && option.value === filter.value) {
            for (_task of taskList) {
                if (_task.group.includes(option.textContent)) {
                    _task.group.splice(_task.group.indexOf(option.textContent), 1)
                }
            }
            filterCollection.splice(filterCollection.indexOf(option.textContent), 1)
            setLocalStorage("filter", filterCollection)
            displayFilter()
        }
    }
    hardRefresh()
}

function removeTaskGroup(event) {
    const _taskDOM = event.target.parentNode
    const filterValue = document.getElementById("filter").value
    let _task = taskList.find(value => value.id === _taskDOM.id)
    _task.group.splice(_task.group.indexOf(filterValue), 1)
    setLocalStorage("taskList", taskList)
    _taskDOM.style.display = "none"
}

let tasksInEditMode = new Set()

function chooseTaskToAdd(event) {
    const addBtn = event.target
    const _taskDOM = addBtn.parentNode
    const task = taskList.find((_task) => _task.id === _taskDOM.id)
    const newFilterValue = document.getElementById("addGroupInput").value.trim()
    if (tasksInEditMode.has(task.id)) {
        task.group.splice(task.group.indexOf(newFilterValue), 1)
        tasksInEditMode.delete(task.id)
        addBtn.className = "fa-solid fa-plus btn addTaskToGroupBtn"
    }
    else {
        const groupTask = new Set(task.group)
        groupTask.add(newFilterValue)
        task.group = Array.from(groupTask);
        tasksInEditMode.add(task.id)
        addBtn.className = "fa-solid fa-minus btn addTaskToGroupBtn"
    }
    document.dispatchEvent(playSoundEffect)
    setLocalStorage("taskList", taskList)
    lightRefresh()
}

function getLocalStorage(key) {
    let value = JSON.parse(localStorage.getItem(key))
    return (value === null) ? [] : value
}

function setLocalStorage(key, value) {
    let _value = JSON.stringify(value)
    localStorage.setItem(key, _value)
}

function setDeadline(deadlineData) {
    if (deadlineData === undefined || deadlineData === "") {
        return
    }
    const deadlineInput = deadlineData.split("T")
    let deadlineDate = deadlineInput[0].split("-")
    let deadlineTime = deadlineInput[1].split(":")
    let deadline = new Date()
    deadline.setFullYear(Number(deadlineDate[0]), Number(deadlineDate[1]) - 1, Number(deadlineDate[2]))
    deadline.setHours(Number(deadlineTime[0]))
    deadline.setMinutes(Number(deadlineTime[1]))

    let currentDate = new Date()

    let remainTime = Math.ceil((deadline - currentDate) / 1000)
    if (remainTime < 0) {
        return ""
    }
    return remainTime
}

function getDeadline(event) {
    const _task = event.target.parentNode
    const deadlineInput = _task.querySelector("#deadline")
    let remainTime = setDeadline(deadlineInput.value)
    for (let task of taskList) {
        if (_task.id === task.id) {
            if (remainTime === "") {
                task.deadline = ""
            }
            else {
                task.deadline = deadlineInput.value
            }
        }
    }
    setLocalStorage("taskList", taskList)
}

function checkDeadline() {
    for (let _task of taskContainer.children) {
        const taskDeadline = _task.querySelector("#deadline").value
        const remainMins = (isNaN(setDeadline(taskDeadline) / 60)) ? "" : (setDeadline(taskDeadline) / 60)
        const taskCheckBox = _task.querySelector(`#${_task.id}check`)
        const deadlineStatus = _task.querySelector('#deadlineStatus')
        _task.style.backgroundColor = ""
        for (let i = 0; i < deadlineStatusClassCollection.length; i++) {
            _task.classList.remove(deadlineStatusClassCollection[i])
        }
        if (remainMins === "") {
            deadlineStatus.textContent = "unset";
        }
        else if (remainMins >= 60 * 24) {
            deadlineStatus.textContent = Math.round(remainMins / (60 * 24)) + " days left"
        }
        else if (remainMins >= 60 && remainMins < 60 * 24) {
            deadlineStatus.textContent = Math.round(remainMins / 60) + " hours left"
        }
        else if (remainMins < 60 && remainMins >= 0) {
            deadlineStatus.textContent = remainMins + " min left"
            if (remainMins === 0) {
                if (taskCheckBox.checked === true) {
                    _task.classList.add("finishedOnTime")
                    _task.classList.remove("unfinishedOnTime")
                    _task.classList.remove("deadlineAlertBackGroundChange")
                    deadlineStatus.textContent = "congrat"
                }
                else if (taskCheckBox.checked === false) {
                    _task.classList.add("unfinishedOnTime")
                    _task.classList.remove("deadlineAlertBackGroundChange")
                    _task.classList.remove("finishedOnTime")
                    deadlineStatus.textContent = "unfinished"
                }
            }
            else if (remainMins < 5 && remainMins > 0) {
                _task.classList.add("deadlineAlertBackGroundChange")
                _task.classList.remove("finishedOnTime")
                _task.classList.remove("unfinishedOnTime")
            }
        }
    }
}

setInterval(checkDeadline, 500)

function removeDeadline(e) {
    let _taskDOM = e.target.parentNode
    _taskDOM.querySelector("#deadline").value = ""
    // _taskDOM.style = ""
    taskList.find((task) => task.id === _taskDOM.id).deadline = ""
    setLocalStorage("taskList", taskList)
}


// inspirational quote

const inspirationalQuote = document.getElementById("inspirationalQuote")

async function genQuote() {
    const response = await fetch(quoteUrlApi)
    const data = await response.json()
    let quote = data[getRdmInt(0, data.length - 1)]
    inspirationalQuote.innerHTML = `<h4>"${quote.q}"</h4>` + "<br>" + `____${quote.a}____`

}

genQuote()

setInterval(genQuote, 60000)

//dark mode

let darkModeOn = (getLocalStorage("darkModeOn").toString() === "") ? true : getLocalStorage("darkModeOn")
const switchThemeBtn = document.getElementById("switchThemeBtn")

function switchTheme() {
    darkModeOn = !darkModeOn
    if (darkModeOn === true) {
        body.classList.add("dark")
    } else if (darkModeOn === false) {
        body.classList.remove("dark")
    }
    setLocalStorage("darkModeOn", darkModeOn)
}

if (darkModeOn === true) {
    body.classList.add("dark")
}
else body.classList.remove("dark")

// check user status

let onlineStatus = window.navigator.onLine
const onlineStatusDisplay = document.getElementById("onlineStatusDisplay")

if (onlineStatus === false) {
    displayOnlineStatus(onlineStatus)
}
setInterval(() => {
    onlineStatus = window.navigator.onLine
    if (onlineStatus === false) {
        onlineStatusDisplay.style.display = "block"
        displayOnlineStatus(onlineStatus)
    } else {
        onlineStatusDisplay.style.display = ""
    }
}, 2000)

function displayOnlineStatus(userStatus) {
    if (userStatus === false) {
        onlineStatusDisplay.innerHTML = "You are currently offline"
    }
}

document.addEventListener("playSoundEffect", () => { soundSrc.play() })

// searh bar
// add search bar
const searchInput = document.getElementById("searchInput")
function searchTask() {
    const searchInputValue = searchInput.value
    if (searchInputValue === "") {
        lightRefresh()
    }
    else {
        lightRefresh()
        const _instantValueofFilteredTask = filteredTask
        filteredTask = _instantValueofFilteredTask.filter(_task => _task.taskContent.toLowerCase().includes(searchInputValue.toLowerCase()))
        refreshTask()
        filteredTask = _instantValueofFilteredTask
    }
    checkDeadline()
}
searchInput.addEventListener("input", searchTask)
filter.addEventListener("change", searchTask)
// progression bar
function updateProgression() {
    let progressionPercentage = (taskList.filter(task => task.checked === true).length / taskList.length) * 100
    progression.innerHTML = Math.round(progressionPercentage) + "%"
    progressionStatusBar.style.width = progressionPercentage + "%"
}
updateProgression()