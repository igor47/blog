---
layout: post
title: Solution to dice
date: "2012-06-25"
---

This is an implementation task, which means that it does not require any
knowledge of data structures and algorithms other than the trivial. (hashes,
arrays, loops, etc.) I assume you have read and understood [the
task](https://www.evernote.com/shard/s30/sh/a249c078-2cff-440d-af2e-af0de21d8d71/5f5c9150efffa0dc627c8b9bbff0ba54).

![Image from the task](/static/images/ioi/dice-task.png)

At first I thought this was more of a brute-force problem, but I realized this
would take exponential time. With bounds of 1 <= N <= 10,000, that would seem
rather unlikely. The observation you have to make, is that when you have placed
the first dice at the bottom, there is only one way the other dice can be
stacked on top of the first one. Because the first dice can be rotated in
exactly 6 ways, the maximum amount of computations is exactly 6n: Θ(6n). (Just
O(n))

While you stack them in your program, you just find the largest size which is
not the one that has to be on top of the previous one, nor the one opposite of
that side. You add that number to some integer. The largest of those integers
for some rotation of the bottommost dice, is the result: the maximum sum of the
  sides.
