const inquirer = require("inquirer");
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "employee_db"
},
    console.log("Connected to employee db")
);

async function choiceHandler(data) {
    console.log(data);
    // Shows departments table
    if(data.choices === "View all departments") {
        db.query("SELECT * FROM department;", (err, results) => {
            if(err) {
                console.log(err);
            }
            console.log(results);
            promptUser();
        });
    } 
    // Shows roles table
    else if(data.choices === "View all roles") {
        db.query("SELECT * FROM role;", (err, results) => {
            if(err) {
                console.log(err);
            }
            console.log(results);
            promptUser();
        });
    } 
    // Shows employees table
    else if(data.choices === "View all employees") {
        db.query("SELECT * FROM employee;", (err, results) => {
            if(err) {
                console.log(err);
            }
            console.log(results);
            promptUser();
        });
    } 
    // Adds a department to departments table
    else if(data.choices === "Add a department") {
        await inquirer.prompt([{
            type: "input",
            name: "department",
            message: "Enter name of department to add:"
        }]).then((value) => {
            db.query("INSERT INTO department (name) VALUES (?);", value.department, (err, results) => {
                if(err) {
                    console.log(err);
                }
                console.log(results);
                promptUser();
            });
        });
    } 
    // Adds a role to roles table
    else if(data.choices === "Add a role") {
        var departmentList = await db.promise().query("SELECT name FROM department;")
        departmentList.pop();

        var departmentArray = [];
        for(let i=0; i < departmentList[0].length; i++){
            const departmentName = departmentList[0][i].name;
            departmentArray.push(departmentName);
        }
        console.log(departmentArray);
        
        await inquirer.prompt([{
            type: "input",
            name: "title",
            message: "Enter title of role:"
        },
        {
            type: "input",
            name: "salary",
            message: "Enter salary of role:"
        },
        {
            type: "list",
            name: "department",
            message: "Which department is this role in?",
            choices: departmentArray,
        }
    ]).then(async (value) => {
            const departmentId = await db.promise().query("SELECT id FROM department WHERE name=?;", value.department);
            console.log(departmentId);
            db.query("INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?);", [value.title, value.salary, departmentId[0][0].id], (err, results) => {
                if(err) {
                    console.log(err);
                }
                console.log(results);
                promptUser();
            });
        });
    }
    // Adds an employee to employees table
    else if(data.choices === "Add an employee") {
        var roleList = await db.promise().query("SELECT title FROM role;")
        roleList.pop();

        var roleArray = [];
        for(let i=0; i < roleList[0].length; i++){
            const departmentName = roleList[0][i].title;
            roleArray.push(departmentName);
        }

        await inquirer.prompt([{
            type: "input",
            name: "firstName",
            message: "Enter first name of employee:"
        },
        {
            type: "input",
            name: "lastName",
            message: "Enter last name of employee:"
        },
        {
            type: "list",
            name: "roleName",
            message: "Choose the employee's role:",
            choices: roleArray,
        },
        {
            type: "input",
            name: "managerId",
            message: "Enter employee ID of the employee's manager:"
        }
    ]).then(async (value) => {
            const roleId = await db.promise().query("SELECT id FROM role WHERE title=?", value.roleName);
            db.query("INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?);", [value.firstName, value.lastName, roleId[0][0].id, value.managerId], (err, results) => {
                if(err) {
                    console.log(err);
                }
                console.log(results);
                promptUser();
            });
        });
    } 
    // Updates an employee's role
    else if(data.choices === "Update an employee's role") {
        async function getNames() {
            var firstNameList = await db.promise().query("SELECT first_name FROM employee",);
            var lastNameList = await db.promise().query("SELECT last_name FROM employee");
            firstNameList.pop();
            lastNameList.pop();
            console.log(firstNameList);
            console.log(lastNameList);
            var fullNameList = [];
            for(let i=0; i < firstNameList[0].length; i++){
                const firstName = firstNameList[0][i].first_name;
                const lastName = lastNameList[0][i].last_name;
                const fullName = firstName + " " + lastName;
                fullNameList.push(fullName);
                console.log(fullNameList);
            }
            return fullNameList;
        }
        async function updateRolePrompt() {
            const employeeNames = await getNames();

            var roleList = await db.promise().query("SELECT title FROM role");
            roleList.pop();
            console.log(roleList);

            var roleArray = [];
            for(let i=0; i < roleList[0].length; i++){
                const role = roleList[0][i].title;
                roleArray.push(role);
            }

            await inquirer.prompt([
                {
                    type: "list",
                    name: "employeeName",
                    message: "Which employee's role would you like to change?",
                    choices: employeeNames,
                },
                {
                    type: "list",
                    name: "employeeRole",
                    message: "What would you like to change the employee's role to?",
                    choices: roleArray,
                }
            ]).then(async (value) => {
                console.log(value);
                const [first, last] = value.employeeName.split(' ');
                const roleNum = await db.promise().query("SELECT id FROM role WHERE title=?;", value.employeeRole);
                console.log(roleNum);
                db.query("UPDATE employee SET role_id=? WHERE first_name=?&&last_name=?;", [roleNum[0][0].id, first, last], (err, results) => {
                    if(err) {
                        console.log(err);
                    }
                    console.log(results);
                    promptUser();
                });
            });
        }
        updateRolePrompt();
    } 
    // Ends the program
    else if(data.choices === "Exit") {
        db.end();
        return false;
    }
}

function promptUser() {
    inquirer.prompt([
        {
            type: "list",
            name: "choices",
            message: "What would you like to do?",
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role", 
                "Add an employee",
                "Update an employee's role",
                "Exit"
            ],
        }
    ]).then(async (value) => { 
        await choiceHandler(value);
    });
}

function init() {
    promptUser();
}

init();