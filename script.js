const createBtn=document.getElementById("createBtn");
const projectMenu=document.getElementById("projectMenu");

createBtn.addEventListener("click",e=>{
  e.stopPropagation();
  projectMenu.classList.toggle("open");
});

document.addEventListener("click",e=>{
  if(!e.target.closest(".create-wrap")) projectMenu.classList.remove("open");
});

const modal=document.getElementById("contributorModal");
const modalName=document.getElementById("modalName");
const modalRank=document.getElementById("modalRank");
const closeModal=document.getElementById("closeModal");

document.querySelectorAll(".person").forEach(person=>{
  person.addEventListener("click",()=>{
    modalName.textContent=person.dataset.name;
    modalRank.textContent=`CONTRIBUTOR / #${person.dataset.rank}`;
    modal.classList.add("open");
  });
});

function hideModal(){modal.classList.remove("open")}
closeModal.addEventListener("click",hideModal);
modal.addEventListener("click",e=>{if(e.target===modal)hideModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")hideModal()});

// Contributor descriptions supplied by the project team.
document.querySelectorAll(".person").forEach(person=>{
  person.addEventListener("click",()=>{
    const bio=document.getElementById("modalBio");
    if(bio) bio.textContent=person.dataset.bio || "Contributor information will be added here.";
  });
});
