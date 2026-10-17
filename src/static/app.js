document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.firstElementChild);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;
        activityCard.dataset.maxParticipants = details.max_participants;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span>${spotsLeft} spots left</span></p>
        `;

        const participantSection = document.createElement("div");
        participantSection.className = "participant-section";

        const participantHeading = document.createElement("h5");
        participantHeading.textContent = `Participants (${details.participants.length})`;
        participantSection.appendChild(participantHeading);

        if (details.participants.length > 0) {
          const participantList = document.createElement("ul");
          participantList.className = "participant-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.textContent = email;
            participantList.appendChild(participant);
          });

          participantSection.appendChild(participantList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "participant-empty";
          emptyMessage.textContent = "No participants yet";
          participantSection.appendChild(emptyMessage);
        }

        activityCard.appendChild(participantSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function addParticipantToCard(activityName, email) {
    const activityCard = Array.from(activitiesList.querySelectorAll(".activity-card"))
      .find((card) => card.dataset.activityName === activityName);

    if (!activityCard) return;

    const participantSection = activityCard.querySelector(".participant-section");
    let participantList = participantSection.querySelector(".participant-list");

    if (!participantList) {
      participantSection.querySelector(".participant-empty").remove();
      participantList = document.createElement("ul");
      participantList.className = "participant-list";
      participantSection.appendChild(participantList);
    }

    const participant = document.createElement("li");
    participant.textContent = email;
    participantList.appendChild(participant);

    const participantCount = participantList.children.length;
    participantSection.querySelector("h5").textContent = `Participants (${participantCount})`;
    const spotsLeft = Number(activityCard.dataset.maxParticipants) - participantCount;
    activityCard.querySelector(".activity-availability span").textContent = `${spotsLeft} spots left`;
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        addParticipantToCard(activity, email);
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
