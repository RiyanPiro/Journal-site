// Function to get current date
function getNewDate(){
    const targetTimezone = 'Asia/Kolkata';
    const currentDate = new Date();
    const options = { timeZone: targetTimezone, day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    const [month, day, year] = formattedDate.split('/');
    return `${day}/${month}/${year}`;
};

// If textarea is not focused, flip pages using arrow keys
window.addEventListener('keydown', (e) => {
    if (!document.activeElement.tagName.toLowerCase().match(/^(textarea|input)$/)) {
        switch (e.key) {
            case "ArrowLeft":
                flipLeftBtn.click();
                break;
            case "ArrowRight":
                flipRightBtn.click();
                break;
        }
    }
});

// Get the latest page number
let currentPageNumber = 1;

window.onload = async () => {
    try {
        const response = await fetch('/latestPage');
        if (response.ok) {
            const latestPage = await response.json();
            currentPageNumber = latestPage.pageNumber;
            console.log("Current Page: ", currentPageNumber);
            document.getElementById('page-number').value = currentPageNumber;
            await displayPage(currentPageNumber);
        } else {
            console.log('No pages found');
        }
    } catch (err) {
        console.log('Error getting latest page', err);
    }
};
// Flip through the pages
const flipRightBtn = document.getElementById('flip-right');
flipRightBtn.addEventListener('click', async () => {
    currentPageNumber++;
    console.log("Current Page: ", currentPageNumber);
    document.getElementById('page-number').value = currentPageNumber;
    await displayPage(currentPageNumber);
});

const flipLeftBtn = document.getElementById('flip-left');
flipLeftBtn.addEventListener('click', async () => {
    if (currentPageNumber > 1) {
        currentPageNumber--;
        console.log("Current Page: ", currentPageNumber);
        document.getElementById('page-number').value = currentPageNumber;
        await displayPage(currentPageNumber);
    }
});

// Display the page data
async function displayPage(pageNumber) {
    try {
        const response = await fetch(`/getPage/${pageNumber}`);
        if (response.ok) {
            const page = await response.json();
            document.getElementById('my-text-area').value = page.content; // Get content from db and display it if exists

            if (page.date) {
                document.getElementById('date-field').value = page.date; // Display date from db if exists
            }
            else {
                const newDate = getNewDate();
                document.getElementById('date-field').value = newDate; // Display current date if not exists
            }

        } else {
            console.log(`Page ${currentPageNumber} not found`);
            document.getElementById('my-text-area').value = ''; // Else, clear the text area and display current date
            document.getElementById('date-field').value = getNewDate();
        }
    } catch (err) {
        console.log('Error getting page', err);
    }
};

// Save info to the database
const textarea = document.getElementById('my-text-area');
textarea.addEventListener('input', () => {
    const pageDate = document.getElementById('date-field').value;
    const content = textarea.value;

    // Make a request to your server to save the page data
    fetch('/savePage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageNumber: currentPageNumber, date: pageDate, content: content }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

// Delete current page on del-page button click 
document.getElementById('del-page').addEventListener('click', () => {
    if (confirm("Delete current page?")) {
        fetch('/deletePage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pageNumber: currentPageNumber }),
        })
        .then(response => {
            if (response.ok) {
                location.reload();
                console.log(`Page ${currentPageNumber} was deleted`);
                alert(`Page ${currentPageNumber} was deleted`);
                return response.text();
            } else {
                console.log("Unable to delete page");
                alert("Unable to delete page");      
                throw new Error('Failed to delete page');
            }
        })
        .catch(err => console.error(err));
    }
});

// Delete all empty pages
document.getElementById('del-empty').addEventListener('click', () => {
    if (confirm("Delete all empty pages?")) {
        fetch('/deleteEmpty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                location.reload();
                console.log('Empty pages were deleted');
                alert('Empty pages were deleted');
                return response.text();
            } else {
                console.log("Unable to delete page");
                alert("Unable to delete page");      
                throw new Error('Failed to delete page');
            }
        })
        .catch(err => console.error(err));
    }
});

// Search for a page
document.getElementById('search-page').parentElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputPageValue = document.getElementById('search-page').value;
    const pageNumber = parseInt(inputPageValue);

    if (!isNaN(pageNumber)) {
        currentPageNumber = pageNumber;
        document.getElementById('page-number').value = currentPageNumber;
        await displayPage(currentPageNumber);
    } else {
        document.getElementById('search-result').value = "Invalid page number";
    }
});

// Search for a pagenumber by date
document.getElementById('search-date').parentElement.addEventListener('submit', async (e) => {
    e.preventDefault()
    const inputDateValue = document.getElementById('search-date').value;

    fetch('/searchByDate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: inputDateValue }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('No pages found for the date');
            }
        })
        .then(data => {
            document.getElementById('search-result').value = `Pages numbers found for the date: ` + JSON.stringify(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('search-result').value = error.message;
        });
});

// Search for a pagenumber by text content
document.getElementById('search-text').parentElement.addEventListener('submit', async (e) => {
    e.preventDefault()
    const inputContentValue = document.getElementById('search-text').value;

    fetch('/searchByText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: inputContentValue }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('No pages found for the text');
            }
        })
        .then(data => {
            document.getElementById('search-result').value = `Pages numbers found for the text: ` + JSON.stringify(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('search-result').value = error.message;
        });
});