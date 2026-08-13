const editor=document.getElementById("richEditor");
const nameInput=document.getElementById("levelName");
const success=document.getElementById("successMessage");
let savedRange=null;

function saveSelection(){
  const sel=window.getSelection();
  if(sel && sel.rangeCount){
    const range=sel.getRangeAt(0);
    if(editor.contains(range.commonAncestorContainer) || range.commonAncestorContainer===editor){
      savedRange=range.cloneRange();
    }
  }
}

function placeCaretAfter(node){
  const range=document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function insertTag(tag){
  editor.focus();
  const range=savedRange ? savedRange.cloneRange() : document.createRange();
  if(!savedRange){
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  const open=document.createTextNode(`<${tag}>`);
  const close=document.createTextNode(`</${tag}>`);

  range.deleteContents();
  range.insertNode(close);
  range.insertNode(open);

  // Put the real browser caret between the opening and closing tags.
  const caretRange=document.createRange();
  caretRange.setStartAfter(open);
  caretRange.collapse(true);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(caretRange);
  savedRange=caretRange.cloneRange();
}

editor.addEventListener("keyup",saveSelection);
editor.addEventListener("mouseup",saveSelection);
editor.addEventListener("focus",saveSelection);

document.querySelectorAll("[data-tag]").forEach(btn=>{
  btn.addEventListener("mousedown",e=>e.preventDefault());
  btn.addEventListener("click",()=>insertTag(btn.dataset.tag));
});

const FIXED_BASE64 = `H3sidiI6MCwibiI6Ik5ldmVyIGdvbm5hIGdpdmUgeW91FSB1cCBzb25pb24gcmluZy4uLiIsInBALAhvcm1hbCIsImcgDAhTX05PX0dPQUwgDwFzIkBPAXQiQAUTbCI6W10sImEiOjEsImMiOjAsIm8gLgoiLCJkIjozMiwiaIAgAW0iQBoAYiAaD2JhY2tncm91bmRfMDI1In0=`;

document.getElementById("generateInject").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(FIXED_BASE64);

    success.textContent = "Base64 copied!";
  } catch (err) {
    console.error(err);

    success.textContent = "Copy failed!";
  }

  setTimeout(() => {
    success.textContent = "";
  }, 2400);
});q
