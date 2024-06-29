
const SESSION_USER = 'juliusomo'



const cloneSection = document.getElementById('clone-this-section')


// Checks user session and change accordingly
const user_session = () => {
    const allCommentCards = document.querySelectorAll('[data-id]')

    // Changes session with value of SESSION_USER as user
    allCommentCards.forEach(commentCard => {
        // If it matches, change "reply" button to "edit" and "delete"
        if (commentCard.querySelector('[data-username]').textContent === SESSION_USER) {
            const buttonReply = commentCard.querySelector('.reply')
            if (buttonReply) {
                const thisStyle = window.getComputedStyle(buttonReply)
                if (thisStyle.display !== 'none') {
                    buttonReply.style.display = 'none'
                    const cloneElement = cloneSection.content.querySelector('.useroptions-container').cloneNode(true)
                    const container = buttonReply.parentNode
                    const buttonsClone = Array.from(cloneElement.childNodes)
                    buttonsClone.forEach(button => {
                        container.appendChild(button)
                    })
                }
            }
        }
    })
}

// Create a comment card
const createCommentCard = (dataComment) => {
    const commentCard = cloneSection.content.querySelector('.comment-card').cloneNode(true)
    commentCard.dataset.id = dataComment.id
    commentCard.querySelector('[data-upvotes]').textContent = dataComment.score
    commentCard.querySelector('[data-user-avatar]').src = dataComment.user.image.webp
    commentCard.querySelector('[data-username]').textContent = dataComment.user.username
    commentCard.querySelector('[data-timestomp]').textContent = dataComment.createdAt
    commentCard.querySelector('[data-comment-content]').textContent = dataComment.content
    // If it a reply comment
    if (dataComment.replyingTo) {
        commentCard.querySelector('[data-replyParent]').innerHTML = `@${dataComment.replyingTo}`
    }
    return commentCard
}


// Create a comment
const commentSection = document.querySelector('.comment-section-container')
const userinput = commentSection.querySelector('.userinput')
const createComment = (dataComment) => {
    // Create a new article comment container
    const newCommentContainer = document.createElement('article')
    newCommentContainer.classList.add('comment-container')

    // And set data
    const newCommentCard = createCommentCard(dataComment)
    newCommentContainer.appendChild(newCommentCard)
    commentSection.insertBefore(newCommentContainer, userinput)


    // If reply exists
    // Create a data
    if (dataComment.replies.length >= 1) {
        const replies = document.createElement('div')
        replies.classList.add('replies-to-parent')
        const line = document.createElement('div') // Reply line
        line.classList.add('line')                 // Interactable
        replies.appendChild(line)
        dataComment.replies.forEach(reply => {
            const replyCard = createCommentCard(reply)
            replies.appendChild(replyCard)
        })
        newCommentContainer.appendChild(replies)
    }
}

//  Count how many comments
function countComments(data) {
    let count = 0;

    function recurse(comments) {
        comments.forEach(comment => {
            count++;
            if (comment.replies && comment.replies.length > 0) {
                recurse(comment.replies);
            }
        });
    }

    recurse(data.comments);
    return count;
}

let existingIDs = 0
// Fetch data.json on the same directory
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("404 Data not found!")
            }
            return response.json()
        })
        .then(data => {
            existingIDs = countComments(data)
            const comments = data.comments
            comments.forEach(dataComment => {
                createComment(dataComment)
            })
            console.table(comments)
            localStorage.setItem('comments', JSON.stringify(comments));
            user_session()
        })
        .catch(error => {
            console.error("404 Data not found!", error)
        })
})


// Base on data.json
// Make new ID
const newID = () => {
    let new_id = existingIDs + 1
    existingIDs = new_id
    return new_id
}



// create object
const createDataObj = (thisUserinput) => {
    const commentContent = thisUserinput.querySelector("textArea").value
    if (commentContent != '') {
        const currentUser = thisUserinput.querySelector('.userinput-avatar')
        const currentUsername = currentUser.dataset.userinputUsername
        const currentUserAvatar = currentUser.querySelector('img').getAttribute('src')
        const commentID = newID()


        const object = {
            "id": commentID,
            "content": commentContent,
            "createdAt": "1 month ago",
            "score": 0,
            "user": {
                "image": {
                    "png": "",
                    "webp": `./${currentUserAvatar}`
                },
                "username": currentUsername
            },
        }
        if (thisUserinput.dataset.hasOwnProperty('parentusername')) {
            // It's a reply
            object.replyingTo = thisUserinput.dataset.parentusername
        }
        else {
            // It is a unique comment
            object.replies = []
        }
        const commentCard = createCommentCard(object)
        return commentCard
    }
}



// Are you sure you want do delete?
const deleteComment = () => {
    return new Promise((resolve) => {

        const overlay = document.querySelector('.overlay')
        const deleteModal = document.querySelector('.delete-modal')

        overlay.style.display = 'block'
        deleteModal.style.display = 'block'

        let choice = false

        const closeModal = (choice) => {
            overlay.style.display = 'none';
            deleteModal.style.display = 'none';
            resolve(choice);
        }

        overlay.addEventListener('click', () => {
            closeModal(false)
        }, { once: true })

        deleteModal.addEventListener('click', event => {
            if (event.target.classList.contains('modal-cancel')) {
                closeModal(false)
            }
            else if (event.target.classList.contains('modal-delete')) {
                closeModal(true)
            }
        }, {once: true})
    })
}



// When user replies to an existing comment
// Using event delegation, trace user id and create reply container
commentSection.addEventListener('click', async event => {
    // If target is reply button
    if (event.target.classList.contains('reply')) {
        const commentParent = event.target.closest('[data-id]')
        const parentComment = commentParent.closest('article')

        // If there isn't an active reply container
        if (!commentParent.parentNode.querySelector('.userinput')) {
            // Create a reply container
            const replyContainer = cloneSection.content.querySelector('.userinput').cloneNode(true)

            // Get username and ID
            const parentID = commentParent.dataset.id
            const parentUsername = commentParent.querySelector('[data-username]').textContent
            replyContainer.getElementsByTagName('textArea')[0].value = `@${parentUsername} `
            replyContainer.dataset.parentid = parentID
            replyContainer.dataset.parentusername = parentUsername

            // If it is a reply to a reply
            if (commentParent.parentNode.classList.contains('replies-to-parent')) {
                commentParent.parentNode.insertBefore(replyContainer, commentParent.nextElementSibling)
            }
            else {
                parentComment.insertBefore(replyContainer, commentParent.nextElementSibling)
            }
        }
    }

    // If target is SEND button
    // Posting a comment/reply
    if (event.target.tagName === 'BUTTON' && event.target.parentNode.classList.contains('userinput')) {
        if (event.target.id == 'newComment') {
            // Extract data
            const thisUserInput = event.target.parentNode
            const commentContent = thisUserInput.querySelector("textArea").value
            // If userinput is not empty
            // Create a comment card with user comment content and data
            // Then append before user input container
            if (commentContent != '') {
                const comment = createDataObj(thisUserInput)
                const newCommentContainer = document.createElement('article')
                newCommentContainer.classList.add('comment-container')
                newCommentContainer.appendChild(comment)
                commentSection.insertBefore(newCommentContainer, userinput)
            }
        }
        else {
            // Look for parent comment ID, add object in reply array
            const parentID = event.target.closest('.userinput').dataset.parentid
            const dataID = `[data-id="${parentID}"]`

            // Trace back to article and search for element there
            const thisUserInput = event.target.closest('.userinput')
            const parentCommentContainer = thisUserInput.closest('.comment-container')
            let replyContainer = parentCommentContainer.querySelector('.replies-to-parent')

            // Create reply container if it doesn't exist
            if (replyContainer === null) {
                parentCommentContainer.insertAdjacentHTML('beforeend', '<div class = "replies-to-parent"><div class="line"></div></div>')
                replyContainer = parentCommentContainer.querySelector('.replies-to-parent')
            }
            // Remove @username after sending button
            thisUserInput.querySelector("textarea").value = thisUserInput.querySelector("textarea").value.split(' ').slice(1).join(' ')
            replyContainer.appendChild(createDataObj(thisUserInput))
            thisUserInput.remove()  // Remove reply container 
        }
    }

    // Vote system
    if (event.target.parentNode.dataset.hasOwnProperty('vote')) {
        const vote = event.target
        const upvotesLabel = vote.closest('[data-vote]').querySelector('[data-upvotes]')
        // If it is the vote button container
        if (vote.dataset.hasOwnProperty('upvote')) {
            // Selects all buttons and check if there is an active vote
            const activeButtons = vote.closest('[data-vote]').querySelectorAll('button')
            let activeVote = false
            activeButtons.forEach(button => {
                if (button.classList.contains('voted-active')) {
                    activeVote = button
                    return
                }
            })
            // If it has not yet been voted
            // Vote and add class active class
            if (activeVote === false) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) + 1
                vote.classList.add('voted-active')
            }
            // If there is already a vote casted
            // Find the active class first, condition if the target is the same active, : 0 ? -2
            else if (vote === activeVote) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) - 1
                activeVote.classList.remove('voted-active')
            }
            // If opposite vote is clicked
            else if (activeVote === vote.closest('[data-vote]').querySelector('[data-downvote]')) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) + 2
                activeVote.classList.remove('voted-active')
                vote.classList.add('voted-active')
            }

        }
        else if (vote.dataset.hasOwnProperty('downvote')) {
            const activeButtons = vote.closest('[data-vote]').querySelectorAll('button')
            let activeVote = false
            activeButtons.forEach(button => {
                if (button.classList.contains('voted-active')) {
                    activeVote = button
                    return
                }
            })
            if (activeVote === false) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) - 1
                vote.classList.add('voted-active')
            }
            else if (vote === activeVote) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) + 1
                activeVote.classList.remove('voted-active')
            }
            // If opposite vote is clicked
            else if (activeVote === vote.closest('[data-vote]').querySelector('[data-upvote]')) {
                upvotesLabel.textContent = Number(upvotesLabel.textContent) - 2
                activeVote.classList.remove('voted-active')
                vote.classList.add('voted-active')
            }
        }
    }

    // If delete/reply button
    if (event.target.parentNode.classList.contains('comment-update-container')) {
        const buttonTarget = event.target
        if (buttonTarget.classList.contains('delete-reply') && buttonTarget.id === 'delete-comment') {
            const thisComment = buttonTarget.closest('.comment-card')
            const choice = await deleteComment()
            if(choice){
                thisComment.remove()
            }
        }

        // If edit
        if (buttonTarget.classList.contains('edit-reply')) {
            // If editing, disable 'EDIT' and 'DELETE' buttons
            Array.from(buttonTarget.parentNode.children).forEach(button => {
                if (button.classList.contains('edit-reply') || button.classList.contains('delete-reply')) {
                    button.disabled = true
                    button.style.cursor = 'not-allowed'
                    button.style.opacity = "50%"
                }
            })
            const thisComment = buttonTarget.closest('.comment-card').querySelector('.comment')
            let commentContent
            Array.from(thisComment.children).forEach(child => {
                child.style.display = 'none'
                if (child.classList.contains('comment-content')) {
                    commentContent = child.textContent
                }
            })

            // Checks if all comment children is indeed hidden
            let allChildrenHidden = Array.from(thisComment.children).every(child => child.style.display === 'none')
            if (allChildrenHidden) {
                // Create a textarea tag
                // Copy comment content value
                const createTextArea = document.createElement('textarea')
                createTextArea.value = commentContent
                createTextArea.classList.add('userinput-textarea')
                thisComment.appendChild(createTextArea)

                // Create a container for both buttons
                const containerForButtons = document.createElement('div')
                containerForButtons.classList.add('container-for-buttons')
                thisComment.appendChild(containerForButtons)

                // Creating a cancel button
                const cancelButton = document.createElement('button')
                cancelButton.textContent = 'Cancel'
                cancelButton.id = 'cancelButton'
                cancelButton.classList.add('delete-reply', 'cancel-button')
                containerForButtons.appendChild(cancelButton)


                // Creating an update button
                const updateButton = document.createElement('button')
                updateButton.textContent = 'UPDATE'
                updateButton.id = 'updateButton'
                updateButton.classList.add('userinput-button')
                containerForButtons.appendChild(updateButton)

            }
        }

    }
    // If update button or cancel button
    if (event.target.parentNode.classList.contains('container-for-buttons') && event.target.tagName === 'BUTTON') {
        const buttonTarget = event.target
        const enableButtons = buttonTarget.closest('.comment-card').querySelector('.comment-update-container')
        // Enable disabled buttons when reply container is canceled/updated
        Array.from(enableButtons.children).forEach(button => {
            button.disabled = false
            button.style.cursor = ''
            button.style.opacity = "100%"
        })
        // If update button
        if (buttonTarget.id == 'updateButton') {
            const userinput = buttonTarget.closest('.comment').querySelector('textArea')
            Array.from(buttonTarget.closest('.comment').children).forEach(p => {
                if (p.tagName === 'P') {
                    p.style.display = 'inline'
                    if (p.classList.contains('comment-content')) {
                        p.textContent = userinput.value
                    }
                }
                if (p.tagName === 'TEXTAREA') {
                    p.remove()
                }
            })
        }
        else if (buttonTarget.id == 'cancelButton') {
            Array.from(buttonTarget.closest('.comment').children).forEach(p => {
                if (p.tagName === 'P') {
                    p.style.display = 'inline'
                }
                if (p.tagName === 'TEXTAREA') {
                    p.remove()
                }
            })
        }

        buttonTarget.parentNode.remove()
    }

    // For when the line is clicked
    // User wants to hide or show replies
    if (event.target.classList.contains('line')) {
        const replies = event.target.parentNode
        const line = Array.from(replies.children)[0]
        Array.from(replies.children).forEach(element => {
            element.style.display = 'none'
        })
        line.style.display = 'block'    // Line set to 'block' always

        // Create a button 'Show replies'
        const showReply = document.createElement('button')
        showReply.classList.add('show-replies')

        // Number of replies
        const repliesLength = replies.children.length - 1   // Exclude line
        console.log(repliesLength)
        showReply.textContent = repliesLength > 1
            ? `Show ${repliesLength} replies`
            : 'Show 1 reply'

        replies.appendChild(showReply)
        line.style.pointerEvents = 'none';
    }

    // Show replies
    if (event.target.classList.contains('show-replies')) {
        const replies = event.target.parentNode
        Array.from(replies.children).forEach(element => {
            element.style.display = 'flex'
        })
        const line = Array.from(replies.children)[0]
        line.style.pointerEvents = 'auto';
        event.target.remove()
    }

    user_session()
})




// Update JSON everytime comment section is updated
const updateJSON = () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("404 Data not found!")
            }
            return response.json()
        })
        .then(data => {
            console.table(data.comments)
        })
        .catch(error => {
            console.error("404 Data not found!", error)
        })
}


updateJSON()