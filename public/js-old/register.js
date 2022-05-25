function nextStep() {
    const fullname = document.forms[0][0].value.trim().length;
    const orgname = document.forms[0][1].value.trim().length;

    let part1 = document.getElementById("part-one");
    let part2 = document.getElementById("part-two");

    if (fullname <= 0 || orgname <= 0) {
      alert("Please fill the form");
    } 
    else {
        part1.style.display = "none";
        part2.style.display = "flex";
    }
}