//---------------------------- SETTINGS ----------------------------//
COLORS = ["#A1C45B", "#F9DF6B", "#B3C5F1", "#B882C6"];
CONGRATS = ["Perfect!", "Amazing!", "Nice!", "Phew!", "Oh no!"]; // zero mistake, 1, 2, 3 or 4, none
EMOJIS = ["🟩","🟨","🟦","🟪"];
SIZE = 80;
SPACING = 10;
SPEED = 300;
ALLOWED_MISTAKES = 4;

//---------------------------- Config ----------------------------//
let full_width = SIZE*4 + SPACING*3;
let selected_count = 0;
let mistakes = 0;
let groups_found = [];
let all_guesses = [];
let words_places = [];
let game_over = false;

//---------------------------- GRID ----------------------------//
function deselectAll() {
    selected_count = 0;
    $(".selected").removeClass("selected");
    $(".submit").addClass("disabled");
    $(".deselect").addClass("disabled");
}
function toggleSelect(e) {
    if(game_over) return;

    if($(e).hasClass("selected")) {
        // Unselect
        selected_count -= 1;
        $(e).toggleClass("selected");
    } else {
        // Select
        if(selected_count < 4) {
            $(e).toggleClass("selected");
            selected_count += 1;
        } else {
            $(e).effect("shake", {distance:5});
        }
    }
    if($(".selected").length == 4) {
        $(".submit").removeClass("disabled");
    } else {
        $(".submit").addClass("disabled");
    }

    if($(".selected").length > 0) {
        $(".deselect").removeClass("disabled");
    } else {
        $(".deselect").addClass("disabled");
    }
}

function onSubmit(){
    if($(".selected").length != 4) return;

    let found_group = checkSelectedGroup();
    let guess_is_new = saveGuess();
    if(found_group != -1) {
        // Matching group
        groups_found.push(found_group);
        moveWinningGroup(found_group);
        if(checkGameOver()) {
            // Game over - all guessed
            afterGameOver();
        }
    } else {
        // Not matching
        $(".selected").effect("shake", {distance:5});
        // Check if this is a new mistake
        if(guess_is_new) {
            mistakes += 1;
            removeMistake();
            if(mistakes == ALLOWED_MISTAKES) {
                // Game over - mistakes
                afterGameOver();
            }
        }
    }
    console.log(all_guesses);
    Cookies.set(GAME_ID+'guesses', all_guesses);
}

function moveWinningGroup(group) {
    // Remove found words from places array
    let index = 0;
    while(index < words_places.length) {
        if(words_places[index][0] == group) {
            let spl = words_places.splice(index, 1);
            console.log(spl);
            continue;
        }
        index++;
    }
    // Animate
    let c = 0;
    $(".selected").each(function(){
        $(this).animate({"top": (groups_found.length-1) * (SIZE+SPACING), "left": c*(SIZE+SPACING), "backgroundColor":COLORS[group]}, SPEED);
        c++;
    });
    addGroupBox(group);
    // Move other words to new places
    reshuffleAll(true);
}

function addGroupBox(group) {
    let gr = $("<div></div>")
        .addClass("group")
        .css({"backgroundColor":COLORS[group], "top":(groups_found.length-1)*(SIZE+SPACING)})
        .hide()
        .html('<div><div class="t">'+WORDS[group][0]+'</div><div class="w">'+WORDS[group][1].join(", ")+'</div></div>')
    $("#grid").append(gr);
    $(gr).delay(SPEED*2).fadeIn(SPEED * 2);
}

function resetFontSizes() {
    $(".word").each(function(e){
        let max = 16;
        let w = $(this).text();
        let size = max;
        if(w.length > 6) {
            size = Math.max(Math.abs(max - w.length) * 1.5, 8);
        }
        $(this).css("fontSize", size);
    });
}

function extractRemainingWords() {
    let rem = [];
    for (var i=0; i<4; i++) {
        if(groups_found.indexOf(i) != -1) continue;
        for (var w=0; w<4; w++) {
            rem.push(WORDS[i][1][w]);
        }
    }
    rem = rem.sort( () => .5 - Math.random() );
    return rem;
}

function addAllWordBlocks() {
    let index = 0;
    for (var i=0; i<4; i++) {
        for (var w=0; w<4; w++) {
            let d = $("<div></div>")
                .addClass("word")
                .attr("id", "w"+index)
                .text(WORDS[i][1][w])
                .on("click", function(){ toggleSelect(this); })
            $("#grid").append(d);
            index++;
            words_places.push([i,d,i,w]); // [0 group, 1 word obj, 2 row, 3 col]
        }
    }
    resetFontSizes();
    reshuffleAll(false);
}

function reshuffleAll(animate) {
    deselectAll();
    // Shuffle remaining words
    words_places = words_places.sort( () => .5 - Math.random() );
    // Assign new places
    let index = 0;
    let starting_row = groups_found.length; // Skipping first rows where categs are found
    for (var i=starting_row; i<4; i++) {
        for (var w=0; w<4; w++) {
            words_places[index][2] = i;
            words_places[index][3] = w;
            index++;
        }
    }
    // Animate
    for(var i=0; i<words_places.length; i++) {
        let location = {"top":words_places[i][2]*(SIZE+SPACING), "left":words_places[i][3]*(SIZE+SPACING)};
        if(animate) {
            $(words_places[i][1]).delay(Math.random()*300).animate(location, SPEED);
        } else {
            $(words_places[i][1]).css(location);
        }
    }
}

function checkSelectedGroup() {
    let guessed = [];
    $(".selected").each(function() {
        guessed.push( findGroup($(this).text()) );
    });

    let group = guessed[0];
    for(var i=1; i<4; i++) {
        if(guessed[i] != group) return -1;
        group = guessed[i];
    }
    return group;
}

function saveGuess() {
    let guessed = [];
    $(".selected").each(function() {
        guessed.push( findGroup($(this).text()) );
    });
    // Add the guess all_guesses guesses only if it wasn't tried before
    let done_before = false;
    let new_guess = guessed.sort().join("");
    for(var i=0;i<all_guesses.length;i++) {
        if(all_guesses[i].sort().join("") == new_guess) done_before = true;
    }
    if(!done_before) {
        all_guesses.push(guessed);
        return true;
    }
    return false;
}

function findGroup(word) {
    for(var g=0; g<4; g++) {
        let wd = WORDS[g][1];
        for(var w=0; w<4; w++) {
            if(wd[w] == word) return g;
        }
    }
    return -1;
}

function checkGameOver() {
    return (groups_found.length == 4);
}

function afterGameOver() {
    game_over = true;
    $("#buttons_results").fadeIn(SPEED);
    $("#buttons_default").fadeOut(SPEED);

    // Show tries/score
    for (var r=0; r<all_guesses.length; r++) {
        for(var c=0;c<4; c++) {
            let d = $("<div></div>").css({"backgroundColor":COLORS[ all_guesses[r][c] ]})
            $(".trys").append(d);
        }
    }

    // Show title
    // [ zero mistake, 1, 2, 3 or more, none ]
    let t = CONGRATS[3];
    if(all_guesses.length == 4) {
        t = CONGRATS[0];
    } else if(all_guesses.length == 5) {
        t = CONGRATS[1];
    } else if(all_guesses.length == 6) {
        t = CONGRATS[2];
    } else if(all_guesses.length > 6) {
        t = CONGRATS[3];
    } 
    if(mistakes == ALLOWED_MISTAKES) {
        t = CONGRATS[4];
    }
    $("#results_pop h2").text(t);
}

function refreshMistakes() {
    const mis = ALLOWED_MISTAKES - mistakes;
    $(".mistakes div").remove();
    for(var i=0; i<mis; i++) {
        $(".mistakes").append("<div>");
    }
}

function removeMistake() {
    $(".mistakes div:last").effect( "puff", {}, SPEED, function(){ $(this).remove(); } );
    if(mistakes == ALLOWED_MISTAKES) {
        $(".mistakes span").fadeOut();
    }
}

function resetAll() {
    groups_found = [];
    addAllWordBlocks();
    refreshMistakes();
    $("#buttons_results").hide();
    $("#buttons_default").show();
    $("#results_pop").hide();
    game_over = false;
    $("#pop_title").text("Four Fours "+getGameNumber());
}

function viewResults() {
    $("#results_pop").fadeIn(SPEED);
}
function hideResults() {
    $("#results_pop").fadeOut(SPEED);
}

function getGameNumber() {
    if(typeof GAME_ID != "undefined" && typeof ALL_GAMES != "undefined") {
        for(var i=0; i<ALL_GAMES.length; i++) {
            if(ALL_GAMES[i] == GAME_ID) {
                return "#"+(i+1);
            }
        }
    }
    return "";
}

function getResultsAsText() {
    let text = "Four Fours";
    let num = getGameNumber();
    if(num != "") text += "\nPuzzle "+num;
    text += "\n";
    for (var r=0; r<all_guesses.length; r++) {    // Guesses
        for(var c=0;c<4; c++) {
            text += EMOJIS[ all_guesses[r][c] ];
        }
        text += "\n";
    }
    return text;
}
function shareResults() {
    if (!('share' in navigator)) {
        alert("Oops! Can't share from this browser.");
        return;
    }
    navigator.share({
        text: getResultsAsText()
      });
}

//---------------------------- INIT ----------------------------//
$(function() {
    
    FastClick.attach(document.body);

    resetAll();

    $("#share").on("click", shareResults);

})