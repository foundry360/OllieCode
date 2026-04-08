---
pdf_options:
  format: Letter
  margin: 20mm 18mm
  printBackground: true
---

# Math is Fun!

**A tiny adventure in OllieCode** · For kids about 7 years old

---

## What you will make

You will teach **Ollie the robot** to play a **math game**:

- Ollie picks two secret numbers, **a** and **b**.
- Ollie asks you: *What is a + b?*
- You type your answer.
- Ollie says **“You’re right!”** or **“Try again!”**

That is your very own **Math is Fun** app.

---

## Before you start

- Ask a **grown-up** to open **OllieCode** on the computer.
- Find the **blocks** on the left and the **stage** (the picture where Ollie lives) on the right.
- Take your time. It is okay to make mistakes — we can fix them.

---

## Step 1 · Wake up the program

1. Look in the toolbox for **Events**.
2. Drag out the block that says **When Run clicked**.
3. This block means: *“Start here when I press the Run button.”*

Everything else will hang under this block like a necklace.

---

## Step 2 · Do the game more than once

1. Open **Control**.
2. Find **repeat … times** and set it to **10** if you want ten rounds.
3. Put **repeat** right under **When Run clicked**.
4. All the next steps go **inside** the repeat — in the mouth of the repeat block.

---

## Step 3 · Pick two surprise numbers

1. Open **Variables** and **Math**.
2. Make two variables named **a** and **b** (the grown-up can help with **Create variable**).
3. Under **repeat**, add:

   - **set a to** … a **random integer from 0 to 10** (or numbers you like).
   - **set b to** … another **random integer**.

Now **a** and **b** are new numbers every round. That keeps the game fun.

---

## Step 4 · Ask the question and remember the answer

1. Open **Variables** and **Text**.
2. Make a variable named **answer** (or **guess** — pick one name and stick with it).
3. Add **set answer to** … and plug in **ask … and wait for number** from **Text**.

4. In the **ask** block, put your question. You can type:

   - a simple line like **What is a + b?**, **or**
   - use **create text with** to build a sentence with **a**, **+**, and **b** so the numbers show up.

When you run the program, you type a number in the box. That number is saved in **answer**.

---

## Step 5 · The magic check (read this twice!)

This is the part that tricks a lot of people. Here is the secret:

You must check whether your typed number is the **same as a + b**.

**Do not** compare two names that mean the same thing in your head but are not set in the computer.

**Do this instead:**

1. Open **Logic** and use **if / else** (or **if** with two parts).
2. In the **if**, use the **equals** test.
3. On the **left**, put the **answer** variable (the round block with **answer**).
4. On the **right**, put **Math** → **add** → plug in **a** and **b**.

So the question in the computer is really:

> Is **answer** the same as **a + b**?

If you compare **guess** to **answer** but you never **set guess** to anything, the game will feel broken. The computer only knows what you **set** with your blocks.

---

## Step 6 · What Ollie says

1. Open **Looks**.
2. Under **if**, put **say … for … seconds** — for example **You’re right!**
3. Under **else**, put another **say** — for example **Try again!**

You can pick your own words. Keep them short so you can read them on the stage.

---

## Step 7 · Press Run and play

1. Tap **Run**.
2. Read Ollie’s question.
3. Type your number and tap **OK**.
4. Watch the speech bubble.

Play a few times. Change **a** and **b** ranges when you are ready for harder math.

---

## Extra fun (optional)

- Add **play sound** under **When Run clicked** for happy music.
- Change the **scene** behind Ollie so your game has a cool background.
- Use **Save** and name your project **Math is Fun** so you can open it again.

---

## If something feels wrong

| What happens | What to try |
|--------------|-------------|
| It always says “Try again” | Check Step 5: left side = **answer**, right side = **a + b**. |
| It always says “You’re right” | You might be comparing the wrong things. Ask a grown-up to read Step 5 with you. |
| The ask box never shows | Make sure **set answer to** and **ask** are **inside** **repeat**, under **When Run clicked**. |

---

**You did it.** You built a real quiz. Ollie is proud of you.

*OllieCode · Math is Fun lesson*
