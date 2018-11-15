var questions;
var joke;
var quote;

//Find question and answers pane and the submit button
var answersDiv = document.getElementById("answers");
var questionDiv = document.getElementById("question");
var button = document.getElementById("button1");

//Hide answer section
answersDiv.style.visibility = "hidden";
answersDiv.innerHTML = "";

button.addEventListener("click", checkResult);

//Init state
var state = {
    nextQuestion: -1,
    correctAnswers: 0
};

// Defines how the url will be constructed
var assembleQuery1 = parameters => {
    var query_string = [];
    for (var key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            var param_string = key + "=" + encodeURIComponent(parameters[key]);
            query_string.push(param_string);
        }
    }

    // Calls to construct url
    return query_string.join("&");
};

// Shuffles an array randomly
function shuffle(a) {
    for (var counter = a.length; counter > 0;) {
        var target = Math.floor(Math.random() * counter);
        counter--;
        var nextOne = a[counter];
        a[counter] = a[target];
        a[target] = nextOne;
    }
}

//function used by JSONP response to parse a quote
function processQuote(response) {
    quote = {
        author: response.quoteAuthor,
        quote: response.quoteText
    };

    console.log(quote);
}

// Reload data
function reloadData() {
    button.style.visibility = "hidden";
    questions = null;
    quote = null;
    joke = null;

    // Code to assemble api link request correctly
    var url = "https://opentdb.com/api.php";
    let params = {
      amount: "5"
    };

    var query_url = url + "?" + assembleQuery1(params);
    console.log(query_url);

    fetch(query_url)
        .then(response => response.json())
        // Creates a new function to store an array of questions
        .then(data => {
            questions = new Array();
            for (var i in data.results) {
                // Grabs a question
                var question = data.results[i];
                var q = new Array();
                for (var j in question.incorrect_answers) {
                    // pushes incorrect answers into a new array
                    q.push({
                        correct: 0,
                        value: question.incorrect_answers[j]
                    });
                }
                q.push({
                    correct: 1,
                    value: question.correct_answer
                });
                // shuffles answers so correct answer isn't always in the same place
                shuffle(q);
                // after shuffling push into an object with a question and an array of answers
                questions.push({
                    question: question.question,
                    answers: q
                });
            }

            shuffle(questions);

            //Since the question is loaded, we can let users press the button
            button.style.visibility = "visible";
        })
        .catch(error => {
            console.log("A communication error(' + error + ') occured. Please try again");

            //Set the question div to the error message and the button will be set appropriately
            questionDiv.innerHTML = "<br>A communication error occurred. Please try again";
            button.value = "TRY AGAIN";
            button.style.visibility = "visible";
        });

    // code to request dad joke api
    query_url = "https://icanhazdadjoke.com/";
    console.log(query_url);
    var request = new Request(query_url, {
        headers: new Headers({
            'Accept': 'text/plain'
        })
    });

    fetch(request)
        .then( response => response.text())
        .then(data => {
            joke = data;
            console.log(data);
        });

    url = "http://api.forismatic.com/api/1.0/";
    params = {
        method: "getQuote",
        format: "jsonp",
        lang: "en",
        jsonp: "processQuote"
    };

    query_url = url + "?" + assembleQuery1(params);
    console.log(query_url);

    //Create script element that loads JSONP from the URL
    sc = document.createElement("script");
    sc.src = query_url;

    //Attach to document, which loads the JSONP script and runs it
    document.querySelector("head").appendChild(sc);
    //Remove the node - it already fired, loaded quote
    sc.parentNode.removeChild(sc);

    state = {
        nextQuestion: -1,
        correctAnswers: 0
    };
}

// This function makes sure that the quiz continues
// until the question limit is reached (5).
// Then the quiz will end
function nextQuestion() {
    // Advance
    state.nextQuestion++;

    // All done, no more questions
    if (state.nextQuestion >= questions.length) {

        // Hide answers section
        answersDiv.style.visibility = "hidden";
        answersDiv.innerHTML = "";

        // If 4 or 5 correct answers -- pass
        if (state.correctAnswers > 3) {
            if (joke === null) {
                //Since there is no joke, show the error message
                questionDiv.innerHTML = "Communication error made it impossible to get a joke. But you did well!";
            }
            else {
                //Joke loaded, success. Show the joke
                questionDiv.innerHTML = joke;
            }

            button.value = "Good Job! Play Again?";
        }
        // If 3 or less incorrect answers -- fail
        else {
            if (quote === null) {
                //Since there is no quote, show the error message and a static quote
                questionDiv.innerHTML = 'Communication error made it impossible to get a quote. But since you failed, here is one of mine:<br><br><div class="quoteText">&ldquo;It takes a fun and creative person to make a fun and creative experience.&rdquo;</div><br><br><div class="quoteAuthor">RM</div>';
            }
            else {
                //Have a quote loaded, success. Show the quote
                questionDiv.innerHTML = quote.quote;
                questionDiv.innerHTML = '<div class="quoteText">&ldquo;' + questionDiv.innerText.trim() + '&rdquo;</div><br><br><div class="quoteAuthor">' + quote.author + '</div>';
            }

            button.value = "You Suck. Play Again?";
        }

        // Get new data
        reloadData();
    } else {
        // First Question, make sure answers are visible and button says NEXT
        if (state.nextQuestion === 0) {
            state.correctAnswers = 0;
            answersDiv.style.visibility = "visible";
            button.value = "NEXT";
        }
        //Last question -- Make sure the button is SUBMIT
        else if (state.nextQuestion === questions.length - 1) {
            button.value = "SUBMIT";
        }

        //Set the question
        questionDiv.innerHTML = questions[state.nextQuestion].question;

        //Create HTML for answers. Put it into a table to assure proper alignment
        var radioHtml = '<table>';
        for (var i in questions[state.nextQuestion].answers) {
            radioHtml += '<tr><td><input type="radio" name="answerValue" value="' + i + '"';

            //The First answer is always checked
            if (i === "0") {
                radioHtml += ' checked="checked"';
            }

            radioHtml += '/><span>' + questions[state.nextQuestion].answers[i].value + '</span></label></td></tr>';
        }

        radioHtml += "</table>";
        answersDiv.innerHTML = radioHtml;
    }
}

//This function executes when the button is pressed. It checks current answer if we're showing a question
function checkResult() {
    if (state.nextQuestion < questions.length - 1 && state.nextQuestion >= 0) {
        console.log("another answer");

        //Get the button values
        var answers = document.getElementsByName("answerValue");
        var selectedAnswer;

        for (var i in answers) {
            if (answers[i].checked) {
                selectedAnswer = answers[i].value;
            }
        }

        if (questions[state.nextQuestion].answers[selectedAnswer].correct) {
            state.correctAnswers++;
        }
    }
    else {
        console.log("Not an answer");
    }

    //If there are no questions, try reloading
    if (question === null) {
        reloadData();
    }
    //Have questions, go to the next one
    else {
        nextQuestion();
    }

}

//Initialise home screen
 questionDiv.innerHTML = "Answer at least 4 questions correctly and you will be rewarded with a dad joke. &nbsp; &nbsp; &nbsp; <br><br> Answer at least 3 inccorectly and you will be punished with an inspirational quote. <br><br>";
 button.value = "LET'S PLAY";

console.log("Loading data");

//Get new data
reloadData();
