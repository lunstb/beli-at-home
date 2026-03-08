resource "aws_iam_user" "github_actions" {
  name = "beli-github-actions"
}

resource "aws_iam_user_policy" "github_actions" {
  name = "beli-deploy-policy"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lightsail:PushContainerImage",
          "lightsail:GetContainerImages",
          "lightsail:CreateContainerServiceDeployment",
          "lightsail:GetContainerServices"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.photos.arn,
          "${aws_s3_bucket.photos.arn}/*",
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      }
    ]
  })
}
